import { useState, useEffect, useCallback } from "react";
import { Variable, variablesToJson, jsonToVariables } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface Draft {
  id: string;
  title: string;
  created_at: string;
  prompt_text?: string;
  master_command?: string;
  variables?: Json;
  primary_toggle?: string | null;
  secondary_toggle?: string | null;
  current_step?: number;
  is_private?: boolean;
}

interface DraftData {
  promptText?: string;
  masterCommand?: string;
  variables?: Variable[];
  selectedPrimary?: string | null;
  secondaryToggle?: string | null;
  currentStep?: number;
  isPrivate?: boolean;
}

export const usePromptDrafts = (
  promptText: string,
  masterCommand: string,
  variables: Variable[],
  selectedPrimary: string | null,
  secondaryToggle: string | null,
  currentStep: number,
  user: any
) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDrafts = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingDrafts(true);
    try {
      const { data, error } = await supabase
        .from('prompt_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setDrafts(data || []);
    } catch (error: any) {
      console.error("Error fetching drafts:", error.message);
      toast({
        title: "Error fetching drafts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingDrafts(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user, fetchDrafts]);

  const saveDraft = useCallback(async () => {
    if (!user) return;
    
    try {
      const draftData = {
        user_id: user.id,
        title: promptText.split('\n')[0] || 'Untitled Draft',
        prompt_text: promptText,
        master_command: masterCommand,
        variables: variablesToJson(variables),
        primary_toggle: selectedPrimary,
        secondary_toggle: secondaryToggle,
        current_step: currentStep,
        is_private: false // Default to not private for drafts
      };
      
      let result;
      
      if (currentDraftId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('prompt_drafts')
          .update(draftData)
          .eq('id', currentDraftId)
          .select();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('prompt_drafts')
          .insert(draftData)
          .select();
        
        if (error) throw error;
        result = data;
        
        if (result && result.length > 0) {
          setCurrentDraftId(result[0].id);
        }
      }
      
      await fetchDrafts();
      return result;
    } catch (error: any) {
      console.error("Error saving draft:", error.message);
      toast({
        title: "Error saving draft",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, promptText, masterCommand, variables, selectedPrimary, secondaryToggle, currentStep, currentDraftId, fetchDrafts, toast]);

  const loadDraft = useCallback(async (draftId: string) => {
    try {
      const { data, error } = await supabase
        .from('prompt_drafts')
        .select('*')
        .eq('id', draftId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setCurrentDraftId(data.id);
        return data;
      }
    } catch (error: any) {
      console.error("Error loading draft:", error.message);
      toast({
        title: "Error loading draft",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadSelectedDraft = useCallback((draft: Draft): DraftData => {
    setCurrentDraftId(draft.id);
    
    return {
      promptText: draft.prompt_text,
      masterCommand: draft.master_command,
      variables: draft.variables ? jsonToVariables(draft.variables as Json) : undefined,
      selectedPrimary: draft.primary_toggle,
      secondaryToggle: draft.secondary_toggle,
      currentStep: draft.current_step,
      isPrivate: draft.is_private || false
    };
  }, []);

  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('prompt_drafts')
        .delete()
        .eq('id', draftId);
      
      if (error) throw error;
      
      if (draftId === currentDraftId) {
        setCurrentDraftId(null);
      }
      
      await fetchDrafts();
      
      toast({
        title: "Draft deleted",
        description: "Your draft has been deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting draft:", error.message);
      toast({
        title: "Error deleting draft",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [currentDraftId, fetchDrafts, toast]);

  const clearDraft = useCallback(async () => {
    if (currentDraftId) {
      await deleteDraft(currentDraftId);
    }
  }, [currentDraftId, deleteDraft]);

  return {
    drafts,
    isLoadingDrafts,
    currentDraftId,
    fetchDrafts,
    saveDraft,
    loadDraft,
    loadSelectedDraft,
    deleteDraft,
    clearDraft
  };
};
