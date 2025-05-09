import { useCallback, useEffect, useState, useRef } from "react";
import { addDays, isBefore } from "date-fns";
import { Variable, variablesToJson, jsonToVariables } from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/context/AuthContext";
import { DRAFT_CFG } from '@/config/drafts';

interface PromptDraft {
  id?: string;
  title: string;
  promptText: string;
  masterCommand: string;
  primaryToggle: string | null;
  secondaryToggle: string | null;
  variables: Variable[];
  currentStep: number;
  updated_at?: string;
}

export const usePromptDrafts = (
  promptText: string,
  masterCommand: string,
  variables: Variable[],
  selectedPrimary: string | null,
  selectedSecondary: string | null,
  currentStep: number,
  user: any
) => {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<PromptDraft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveAttempts, setSaveAttempts] = useState(0);
  const [deletedDraftIds, setDeletedDraftIds] = useState<Set<string>>(new Set());
  const maxRetries = 3;
  const { sessionExpiresAt } = useAuth();
  
  // How often to auto-save drafts (in milliseconds)
  const autoSaveInterval = DRAFT_CFG.AUTO_SAVE_MS;
  
  // Track previous values to detect changes
  const prevValuesRef = useRef({
    promptText,
    masterCommand,
    variables: JSON.stringify(variables),
    selectedPrimary,
    selectedSecondary,
    currentStep
  });
  
  // Detect changes to mark as dirty - only on steps 2 and 3
  useEffect(() => {
    if (currentStep === 2 || currentStep === 3) {
      const prevValues = prevValuesRef.current;
      
      const hasChanged = 
        prevValues.promptText !== promptText ||
        prevValues.masterCommand !== masterCommand || 
        prevValues.variables !== JSON.stringify(variables) ||
        prevValues.selectedPrimary !== selectedPrimary ||
        prevValues.selectedSecondary !== selectedSecondary;
      
      if (hasChanged) {
        setIsDirty(true);
      }
      
      // Update ref with current values
      prevValuesRef.current = {
        promptText,
        masterCommand,
        variables: JSON.stringify(variables),
        selectedPrimary,
        selectedSecondary,
        currentStep
      };
    }
  }, [promptText, masterCommand, variables, selectedPrimary, selectedSecondary, currentStep]);

  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingDrafts(true);
    try {
      // First, get all saved prompts for this user
      const { data: savedPrompts, error: savedPromptsError } = await supabase
        .from('prompts')
        .select('prompt_text')
        .eq('user_id', user.id);
      
      if (savedPromptsError) {
        // Check for auth errors specifically
        if (savedPromptsError.message?.includes('JWT') || 
            savedPromptsError.message?.includes('token')) {
          console.log('Auth error detected in fetchDrafts');
          throw new Error('Auth token expired');
        }
        throw savedPromptsError;
      }
      
      // Get all drafts
      const { data, error } = await supabase
        .from('prompt_drafts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false) // Only fetch non-deleted drafts
        .order('updated_at', { ascending: false });
      
      if (error) {
        // Check for auth errors specifically
        if (error.message?.includes('JWT') || 
            error.message?.includes('token')) {
          console.log('Auth error detected in fetchDrafts');
          throw new Error('Auth token expired');
        }
        throw error;
      }
      
      if (data) {
        // Filter out expired drafts
        const fresh = data.filter(d => !d.expires_at || isBefore(new Date(), new Date(d.expires_at)));
        if (fresh.length !== data.length) {
          // hard-delete expired rows server-side (fire-and-forget)
          await supabase.from('prompt_drafts')
            .delete()
            .lte('expires_at', new Date().toISOString());
        }
        
        // Filter out duplicates, saved prompts, and manually tracked deleted drafts
        const uniqueDrafts = new Map();
        
        fresh.forEach(draft => {
          // Skip if this draft has been manually marked as deleted
          if (draft.id && deletedDraftIds.has(draft.id)) {
            return;
          }
          
          // Skip if this is a saved prompt
          const isAlreadySaved = savedPrompts?.some(saved => 
            saved.prompt_text?.trim() === draft.prompt_text?.trim()
          );
          
          if (!isAlreadySaved && draft.prompt_text) {
            // Only keep the most recent version of each draft
            const existingDraft = uniqueDrafts.get(draft.prompt_text.trim());
            if (!existingDraft || new Date(draft.updated_at) > new Date(existingDraft.updated_at)) {
              uniqueDrafts.set(draft.prompt_text.trim(), draft);
            }
          }
        });
        
        const formattedDrafts: PromptDraft[] = Array.from(uniqueDrafts.values()).map(draft => ({
          id: draft.id,
          title: draft.title || 'Untitled Draft',
          promptText: draft.prompt_text || '',
          masterCommand: draft.master_command || '',
          primaryToggle: draft.primary_toggle,
          secondaryToggle: draft.secondary_toggle,
          variables: jsonToVariables(draft.variables as Json),
          currentStep: draft.current_step || 1,
          updated_at: draft.updated_at
        }));
        
        setDrafts(formattedDrafts);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        title: "Couldn't load drafts",
        description: "We had trouble loading your drafts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDrafts(false);
    }
  }, [user, toast, deletedDraftIds]);

  const saveDraft = useCallback(async (force = false) => {
    // Don't save drafts if:
    // 1. No user is logged in
    // 2. No prompt text
    // 3. /* allow all steps – snapshots handle step-3 cleanup */
    // 4. Nothing has changed (not dirty) unless forced
    if (!user || 
        !promptText.trim() || 
        (isSaving && saveAttempts >= maxRetries) || 
        (!isDirty && !force)) {
      console.log(`Not saving draft. Step: ${currentStep}, Has text: ${!!promptText.trim()}, User: ${!!user}, Dirty: ${isDirty}, Force: ${force}`);
      return;
    }

    setIsSaving(true);
    setSaveAttempts(prev => prev + 1);

    try {
      // Ensure we're saving plain text by removing any HTML tags if present
      const plainTextPrompt = promptText.replace(/<[^>]*>/g, '');
      const title = plainTextPrompt.split('\n')[0] || 'Untitled Draft';
      
      let draftId = currentDraftId;
      
      if (!draftId) {
        const { data: existingDrafts, error: searchError } = await supabase
          .from('prompt_drafts')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', title)
          .eq('is_deleted', false) // Only check non-deleted drafts
          .limit(1);
          
        if (searchError) throw searchError;
        
        if (existingDrafts && existingDrafts.length > 0) {
          draftId = existingDrafts[0].id;
          setCurrentDraftId(draftId);
        }
      }
      
      // Check if this is already a saved prompt - if so, don't create a draft
      const { data: existingSavedPrompts, error: savedPromptsError } = await supabase
        .from('prompts')
        .select('id')
        .eq('user_id', user.id)
        .eq('prompt_text', plainTextPrompt)
        .limit(1);
        
      if (savedPromptsError) throw savedPromptsError;
      
      if (existingSavedPrompts && existingSavedPrompts.length > 0) {
        console.log("This prompt is already saved, not creating a draft");
        setIsDirty(false);
        setIsSaving(false);
        setSaveAttempts(0);
        return;
      }
      
      const draft = {
        user_id: user.id,
        title: title,
        prompt_text: plainTextPrompt,
        master_command: masterCommand,
        primary_toggle: selectedPrimary,
        secondary_toggle: selectedSecondary,
        variables: variablesToJson(variables),
        current_step: currentStep,
        is_deleted: false, // Explicitly mark as not deleted
        expires_at: addDays(new Date(), DRAFT_CFG.TTL_DAYS).toISOString()
      };

      if (draftId) {
        const { error } = await supabase
          .from('prompt_drafts')
          .update(draft)
          .eq('id', draftId);
          
        if (error) throw error;
        console.log("Draft updated successfully");
      } else {
        const { data, error } = await supabase
          .from('prompt_drafts')
          .insert(draft)
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setCurrentDraftId(data[0].id);
          console.log("New draft created successfully");
        }
      }

      const expiresAt = addDays(new Date(), DRAFT_CFG.TTL_DAYS).toISOString();
      localStorage.setItem('promptDraft', JSON.stringify({
        id: draftId,
        promptText: plainTextPrompt,
        masterCommand,
        variables,
        selectedPrimary,
        selectedSecondary,
        currentStep,
        timestamp: new Date().toISOString(),
        expiresAt
      }));

      // Draft successfully saved, mark as not dirty
      setIsDirty(false);
      setIsSaving(false);
      setSaveAttempts(0);
      
      // Show toast only for explicit saves, not automatic ones
      if (force) {
        toast({
          title: "Draft saved",
          description: "Your draft has been saved successfully.",
        });
      }

      fetchDrafts();
    } catch (error) {
      console.error('Error saving draft:', error);
      
      if (saveAttempts < maxRetries) {
        // Retry with exponential backoff
        setTimeout(() => {
          console.log(`Retrying save (attempt ${saveAttempts + 1}/${maxRetries})...`);
          saveDraft(force);
        }, Math.pow(2, saveAttempts) * 1000);
      } else {
        // Still save to localStorage as a backup after max retries
        const expiresAt = addDays(new Date(), DRAFT_CFG.TTL_DAYS).toISOString();
        localStorage.setItem('promptDraft', JSON.stringify({
          promptText: promptText.replace(/<[^>]*>/g, ''),
          masterCommand,
          variables,
          selectedPrimary,
          selectedSecondary,
          currentStep,
          timestamp: new Date().toISOString(),
          expiresAt
        }));
        
        setIsSaving(false);
        
        if (force) {
          toast({
            title: "Error saving to cloud",
            description: "Your draft was saved locally. Please check your connection.",
            variant: "destructive",
          });
        }
      }
    }
  }, [promptText, masterCommand, variables, selectedPrimary, selectedSecondary, currentStep, user, currentDraftId, fetchDrafts, isDirty, isSaving, saveAttempts, toast]);

  // Add auto-save functionality at regular intervals for steps 2 and 3
  useEffect(() => {
    if (!user || !isDirty) return;
    
    const autoSaveTimer = setTimeout(() => {
      console.log("Auto-saving draft...");
      saveDraft(false);
    }, autoSaveInterval);
    
    return () => clearTimeout(autoSaveTimer);
  }, [user, isDirty, saveDraft, currentStep, autoSaveInterval, promptText, masterCommand, variables]);

  const loadDraft = useCallback(async () => {
    if (!user) return null;

    try {
      const { data: drafts, error } = await supabase
        .from('prompt_drafts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false) // Only get non-deleted drafts
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (drafts && drafts.length > 0) {
        // Check if draft has expired
        if (drafts[0].expires_at && !isBefore(new Date(), new Date(drafts[0].expires_at))) {
          // Draft expired, clean up and return null
          await supabase.from('prompt_drafts').delete().eq('id', drafts[0].id);
          return null;
        }
        
        // If the draft is for step 1, don't load it since we only want to load drafts for steps 2 and 3
        if (drafts[0].current_step === 1) {
          return null;
        }
        
        return {
          promptText: drafts[0].prompt_text,
          masterCommand: drafts[0].master_command,
          variables: drafts[0].variables ? jsonToVariables(drafts[0].variables as Json) : [],
          selectedPrimary: drafts[0].primary_toggle,
          selectedSecondary: drafts[0].secondary_toggle,
          currentStep: drafts[0].current_step,
        };
      }

      // Only check local storage if no drafts found in the database
      const localDraft = localStorage.getItem('promptDraft');
      if (localDraft) {
        const parsed = JSON.parse(localDraft);
        
        // Check if local draft has expired
        if (parsed.expiresAt && !isBefore(new Date(), new Date(parsed.expiresAt))) {
          // Local draft expired, remove it
          localStorage.removeItem('promptDraft');
          return null;
        }
        
        // If the draft is for step 1, don't load it
        if (parsed.currentStep === 1) {
          return null;
        }
        
        return parsed;
      }

    } catch (error) {
      console.error('Error loading draft:', error);
      
      // Check if local draft exists and verify it
      const localDraft = localStorage.getItem('promptDraft');
      if (localDraft) {
        const parsed = JSON.parse(localDraft);
        
        // Check if local draft has expired
        if (parsed.expiresAt && !isBefore(new Date(), new Date(parsed.expiresAt))) {
          // Local draft expired, remove it
          localStorage.removeItem('promptDraft');
          return null;
        }
        
        // If the draft is for step 1, don't load it
        if (parsed.currentStep === 1) {
          return null;
        }
        
        return parsed;
      }
    }

    return null;
  }, [user]);

  const clearDraft = useCallback(async () => {
    if (!user) return;

    try {
      if (currentDraftId) {
        // Update the is_deleted flag instead of actually deleting
        const { error } = await supabase
          .from('prompt_drafts')
          .update({ is_deleted: true })
          .eq('id', currentDraftId);

        if (error) throw error;
      }

      localStorage.removeItem('promptDraft');
      setCurrentDraftId(null);

    } catch (error) {
      console.error('Error clearing draft:', error);
      localStorage.removeItem('promptDraft');
      setCurrentDraftId(null);
    }
  }, [user, currentDraftId]);

  const deleteDraft = useCallback(async (draftId: string) => {
    if (!user || !draftId) return;

    try {
      console.log(`Deleting draft with ID: ${draftId}`);
      
      // Add to local tracking of deleted drafts
      setDeletedDraftIds(prev => new Set([...prev, draftId]));
      
      // Update in database - mark as deleted instead of removing completely
      const { error } = await supabase
        .from('prompt_drafts')
        .update({ is_deleted: true })
        .eq('id', draftId);

      if (error) {
        console.error('Database error when deleting draft:', error);
        throw error;
      }

      // Remove from local state
      setDrafts(prevDrafts => prevDrafts.filter(draft => draft.id !== draftId));
      
      // If the deleted draft is the current draft, clear local storage and currentDraftId
      if (draftId === currentDraftId) {
        localStorage.removeItem('promptDraft');
        setCurrentDraftId(null);
      }
      
      // Also check local storage to make sure the draft is removed if it exists there
      const localDraft = localStorage.getItem('promptDraft');
      if (localDraft) {
        const parsedDraft = JSON.parse(localDraft);
        if (parsedDraft.id === draftId) {
          localStorage.removeItem('promptDraft');
        }
      }
      
      // For debugging
      console.log(`Draft ${draftId} marked as deleted and removed from UI`);
      
      toast({
        title: "Success",
        description: "Draft deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft: " + (error?.message || "Unknown error"),
        variant: "destructive",
      });
    }
  }, [user, toast, currentDraftId]);

  const loadSelectedDraft = useCallback((draft: PromptDraft) => {
    if (!draft.id) return null;
    
    // Check if this draft is already deleted (should not happen in UI but as a safeguard)
    if (deletedDraftIds.has(draft.id)) {
      console.warn(`Attempted to load draft ${draft.id} that was marked as deleted`);
      toast({
        title: "Warning",
        description: "This draft has been deleted",
        variant: "destructive",
      });
      return null;
    }
    
    setCurrentDraftId(draft.id);
    
    // Update local storage with the selected draft
    const expiresAt = addDays(new Date(), DRAFT_CFG.TTL_DAYS).toISOString();
    localStorage.setItem('promptDraft', JSON.stringify({
      id: draft.id,
      promptText: draft.promptText,
      masterCommand: draft.masterCommand,
      variables: draft.variables,
      selectedPrimary: draft.primaryToggle,
      secondaryToggle: draft.secondaryToggle,
      currentStep: draft.currentStep,
      timestamp: new Date().toISOString(),
      expiresAt
    }));
    
    // Reset dirty state when loading a draft
    setIsDirty(false);
    
    return {
      promptText: draft.promptText,
      masterCommand: draft.masterCommand,
      variables: draft.variables,
      selectedPrimary: draft.primaryToggle,
      secondaryToggle: draft.secondaryToggle,
      currentStep: draft.currentStep
    };
  }, [deletedDraftIds, toast]);

  // Check for session expiration to save drafts
  useEffect(() => {
    if (sessionExpiresAt && isDirty) {
      const now = new Date();
      const timeToExpiry = sessionExpiresAt.getTime() - now.getTime();
      
      // If session will expire in less than 2 minutes, save the draft
      if (timeToExpiry < 2 * 60 * 1000 && timeToExpiry > 0) {
        console.log("Session expiring soon, saving draft...");
        saveDraft(true);
      }
    }
  }, [sessionExpiresAt, isDirty, saveDraft]);

  // Window visibility event handler to save drafts when the user leaves the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isDirty) {
        console.log("Page hidden, saving draft...");
        saveDraft(false);
      }
    };
    
    // Handle page unload/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        console.log("Page unloading, saving draft...");
        saveDraft(false);
        
        // Show browser confirmation dialog
        e.preventDefault();
        e.returnValue = ''; // This is required for showing the confirmation dialog
        return ''; // This text is not actually displayed by most browsers
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, saveDraft, currentStep]);

  return {
    drafts,
    isLoadingDrafts,
    saveDraft,
    loadDraft,
    clearDraft,
    fetchDrafts,
    deleteDraft,
    loadSelectedDraft,
    currentDraftId,
    isDirty,
    isSaving
  };
};
