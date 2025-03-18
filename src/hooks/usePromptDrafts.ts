import { useCallback, useEffect, useState } from "react";
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
  isPrivate?: boolean;
}

export const usePromptDrafts = (
  promptText: string,
  masterCommand: string,
  variables: Variable[],
  selectedPrimary: string | null,
  selectedSecondary: string | null,
  currentStep: number,
  user: any,
  isPrivate: boolean = false
) => {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<PromptDraft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  
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

  const saveDraft = useCallback(async () => {
    // Don't save drafts if:
    // 1. No user is logged in
    // 2. No prompt text
    // 3. We're on step 1 (haven't analyzed the prompt yet)
    if (!user || !promptText.trim() || currentStep === 1) return;

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
        is_private: isPrivate
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
        isPrivate,
        timestamp: new Date().toISOString()
      }));

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
        isPrivate,
        timestamp: new Date().toISOString()
      }));
    }
  }, [promptText, masterCommand, variables, selectedPrimary, selectedSecondary, currentStep, user, currentDraftId, fetchDrafts, isPrivate]);

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
        isPrivate: draft.isPrivate,
        timestamp: new Date().toISOString()
      }));
    }
    
    return {
      promptText: draft.promptText,
      masterCommand: draft.masterCommand,
      variables: draft.variables,
      selectedPrimary: draft.primaryToggle,
      secondaryToggle: draft.secondaryToggle,
      currentStep: draft.currentStep,
      isPrivate: draft.isPrivate
    };
  }, []);

  // Window visibility event handler to save drafts when the user leaves the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentStep > 1) {
        saveDraft();
      }
    };

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveDraft, currentStep]);

  return {
    drafts,
    isLoadingDrafts,
    saveDraft,
    loadDraft,
    clearDraft,
    fetchDrafts,
    deleteDraft,
    loadSelectedDraft,
    currentDraftId
  };
};
