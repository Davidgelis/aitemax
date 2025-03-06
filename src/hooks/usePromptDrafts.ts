
import { useCallback, useEffect, useState } from "react";
import { Variable, variablesToJson, jsonToVariables } from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const saveDraft = useCallback(async () => {
    if (!user) return;

    try {
      const draft = {
        user_id: user.id,
        title: promptText.split('\n')[0] || 'Untitled Draft',
        prompt_text: promptText,
        master_command: masterCommand,
        primary_toggle: selectedPrimary,
        secondary_toggle: selectedSecondary,
        variables: variablesToJson(variables),
        current_step: currentStep,
      };

      const { error } = await supabase
        .from('prompt_drafts')
        .upsert(draft);

      if (error) throw error;

      // Also save to localStorage as backup
      localStorage.setItem('promptDraft', JSON.stringify({
        promptText,
        masterCommand,
        variables,
        selectedPrimary,
        selectedSecondary,
        currentStep,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error saving draft:', error);
      // If database save fails, save to localStorage as fallback
      localStorage.setItem('promptDraft', JSON.stringify({
        promptText,
        masterCommand,
        variables,
        selectedPrimary,
        selectedSecondary,
        currentStep,
        timestamp: new Date().toISOString()
      }));
    }
  }, [promptText, masterCommand, variables, selectedPrimary, selectedSecondary, currentStep, user]);

  const loadDraft = useCallback(async () => {
    if (!user) return null;

    try {
      // First try to load from Supabase
      const { data: drafts, error } = await supabase
        .from('prompt_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (drafts && drafts.length > 0) {
        return {
          promptText: drafts[0].prompt_text,
          masterCommand: drafts[0].master_command,
          variables: drafts[0].variables,
          selectedPrimary: drafts[0].primary_toggle,
          selectedSecondary: drafts[0].secondary_toggle,
          currentStep: drafts[0].current_step,
        };
      }

      // If no Supabase draft, try localStorage
      const localDraft = localStorage.getItem('promptDraft');
      if (localDraft) {
        return JSON.parse(localDraft);
      }

    } catch (error) {
      console.error('Error loading draft:', error);
      // If database load fails, try localStorage
      const localDraft = localStorage.getItem('promptDraft');
      if (localDraft) {
        return JSON.parse(localDraft);
      }
    }

    return null;
  }, [user]);

  const clearDraft = useCallback(async () => {
    if (!user) return;

    try {
      // Clear from Supabase
      const { error } = await supabase
        .from('prompt_drafts')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Clear from localStorage
      localStorage.removeItem('promptDraft');

    } catch (error) {
      console.error('Error clearing draft:', error);
      // Still clear localStorage even if database clear fails
      localStorage.removeItem('promptDraft');
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
          variables: jsonToVariables(draft.variables),
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

  // Auto-save draft every 30 seconds if there are changes
  useEffect(() => {
    if (!promptText) return;

    const intervalId = setInterval(saveDraft, 30000);
    return () => clearInterval(intervalId);
  }, [promptText, masterCommand, variables, selectedPrimary, selectedSecondary, currentStep, saveDraft]);

  // Fetch drafts on mount
  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user, fetchDrafts]);

  return {
    drafts,
    isLoadingDrafts,
    saveDraft,
    loadDraft,
    clearDraft,
    fetchDrafts
  };
};
