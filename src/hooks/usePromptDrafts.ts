import { useCallback, useEffect, useState, useRef } from "react";
import { Variable, variablesToJson, jsonToVariables } from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

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
  const previousStateRef = useRef({ promptText, masterCommand, variables, currentStep });
  
  // Track if content has changed by comparing to previous state
  useEffect(() => {
    if (currentStep === 2) {
      const hasPromptTextChanged = promptText !== previousStateRef.current.promptText;
      const hasMasterCommandChanged = masterCommand !== previousStateRef.current.masterCommand;
      const hasVariablesChanged = JSON.stringify(variables) !== JSON.stringify(previousStateRef.current.variables);
      
      // Only set dirty state if something has actually changed
      if (hasPromptTextChanged || hasMasterCommandChanged || hasVariablesChanged) {
        setIsDirty(true);
        
        // Update the reference for next comparison
        previousStateRef.current = { promptText, masterCommand, variables, currentStep };
      }
    } else {
      // Reset dirty state if we're not on step 2
      setIsDirty(false);
    }
  }, [promptText, masterCommand, variables, currentStep]);
  
  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingDrafts(true);
    try {
      const { data, error } = await supabase
        .from('prompt_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedDrafts: PromptDraft[] = data.map(draft => ({
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
    } finally {
      setIsLoadingDrafts(false);
    }
  }, [user]);

  const saveDraft = useCallback(async (forceSave = false) => {
    // Don't save drafts if:
    // 1. No user is logged in
    // 2. No prompt text
    // 3. We're on step 1 (haven't analyzed the prompt yet)
    // 4. Or we're on step 3 (final prompt)
    // 5. Content hasn't changed (not dirty) unless forceSave is true
    if (!user || !promptText.trim() || currentStep === 1 || currentStep === 3 || (!isDirty && !forceSave)) {
      console.log(`Not saving draft. Step: ${currentStep}, Has text: ${!!promptText.trim()}, User: ${!!user}, Dirty: ${isDirty}, Force: ${forceSave}`);
      return;
    }

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

      localStorage.setItem('promptDraft', JSON.stringify({
        id: draftId,
        promptText: plainTextPrompt,
        masterCommand,
        variables,
        selectedPrimary,
        selectedSecondary,
        currentStep,
        timestamp: new Date().toISOString()
      }));

      // Reset dirty state after successful save
      setIsDirty(false);
      fetchDrafts();
    } catch (error) {
      console.error('Error saving draft:', error);
      // Still save to localStorage as a backup
      localStorage.setItem('promptDraft', JSON.stringify({
        promptText: promptText.replace(/<[^>]*>/g, ''),
        masterCommand,
        variables,
        selectedPrimary,
        selectedSecondary,
        currentStep,
        timestamp: new Date().toISOString()
      }));
    }
  }, [promptText, masterCommand, variables, selectedPrimary, selectedSecondary, currentStep, user, currentDraftId, fetchDrafts, isDirty]);

  const loadDraft = useCallback(async () => {
    if (!user) return null;

    try {
      const { data: drafts, error } = await supabase
        .from('prompt_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (drafts && drafts.length > 0) {
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
        const { error } = await supabase
          .from('prompt_drafts')
          .delete()
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
    if (!user) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('prompt_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;

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
      
      toast({
        title: "Success",
        description: "Draft deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive",
      });
    }
  }, [user, toast, currentDraftId]);

  const loadSelectedDraft = useCallback((draft: PromptDraft) => {
    if (draft.id) {
      setCurrentDraftId(draft.id);
      
      // Update local storage with the selected draft
      localStorage.setItem('promptDraft', JSON.stringify({
        id: draft.id,
        promptText: draft.promptText,
        masterCommand: draft.masterCommand,
        variables: draft.variables,
        selectedPrimary: draft.primaryToggle,
        secondaryToggle: draft.secondaryToggle,
        currentStep: draft.currentStep,
        timestamp: new Date().toISOString()
      }));
    }
    
    return {
      promptText: draft.promptText,
      masterCommand: draft.masterCommand,
      variables: draft.variables,
      selectedPrimary: draft.primaryToggle,
      secondaryToggle: draft.secondaryToggle,
      currentStep: draft.currentStep
    };
  }, []);

  // Window visibility event handler to save drafts when the user leaves the page
  // Only save drafts if we're on step 2 and content has changed
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentStep === 2 && isDirty) {
        console.log("Saving draft on tab visibility change");
        saveDraft(true);
      }
    };

    // Save draft on page unload/tab close if dirty
    const handleBeforeUnload = () => {
      if (currentStep === 2 && isDirty) {
        console.log("Saving draft on page unload");
        saveDraft(true);
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
  }, [saveDraft, currentStep, isDirty]);

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
    isDirty
  };
};
