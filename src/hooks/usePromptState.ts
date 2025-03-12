
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Variable, jsonToVariables, variablesToJson } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";

export const usePromptState = (user: any) => {
  const [promptText, setPromptText] = useState<string>("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [showJson, setShowJson] = useState<boolean>(false);
  const [finalPrompt, setFinalPrompt] = useState<string>("");
  const [editingPrompt, setEditingPrompt] = useState<string>("");
  const [showEditPromptSheet, setShowEditPromptSheet] = useState<boolean>(false);
  const [masterCommand, setMasterCommand] = useState<string>("");
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const [isViewingSavedPrompt, setIsViewingSavedPrompt] = useState<boolean>(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState<boolean>(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const fetchSavedPrompts = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingPrompts(true);
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setSavedPrompts(data || []);
    } catch (error) {
      console.error('Error fetching saved prompts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch saved prompts",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [user, toast]);

  const handleNewPrompt = useCallback(() => {
    setPromptText("");
    setQuestions([]);
    setVariables([]);
    setFinalPrompt("");
    setEditingPrompt("");
    setShowEditPromptSheet(false);
    setMasterCommand("");
    setSelectedPrimary(null);
    setSelectedSecondary(null);
    setCurrentStep(1);
    setIsViewingSavedPrompt(false);
    setCurrentDraftId(null);
  }, []);

  const handleSavePrompt = useCallback(async (title: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You need to be logged in to save prompts",
        variant: "destructive",
      });
      return;
    }
    
    if (!title) {
      toast({
        title: "Error",
        description: "Please provide a title for your prompt",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .insert({
          title,
          prompt_text: promptText,
          master_command: masterCommand,
          primary_toggle: selectedPrimary,
          secondary_toggle: selectedSecondary,
          variables: variablesToJson(variables),
          user_id: user.id
        })
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Prompt saved successfully!",
      });
      
      fetchSavedPrompts();
      setIsViewingSavedPrompt(true);
      
      // Return the newly created prompt ID
      return data?.[0]?.id;
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error",
        description: "Failed to save prompt",
        variant: "destructive",
      });
      return null;
    }
  }, [promptText, masterCommand, selectedPrimary, selectedSecondary, variables, user, toast, fetchSavedPrompts]);

  const handleDeletePrompt = useCallback(async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Prompt deleted successfully!",
      });
      
      fetchSavedPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      });
    }
  }, [user, toast, fetchSavedPrompts]);

  const handleDuplicatePrompt = useCallback(async (id: string) => {
    if (!user) return;
    
    try {
      // First fetch the prompt to duplicate
      const { data: promptData, error: fetchError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Create a new prompt with the same data
      const { error: insertError } = await supabase
        .from('prompts')
        .insert({
          title: `${promptData.title} (Copy)`,
          prompt_text: promptData.prompt_text,
          master_command: promptData.master_command,
          primary_toggle: promptData.primary_toggle,
          secondary_toggle: promptData.secondary_toggle,
          variables: promptData.variables,
          user_id: user.id
        });
        
      if (insertError) throw insertError;
      
      toast({
        title: "Success",
        description: "Prompt duplicated successfully!",
      });
      
      fetchSavedPrompts();
    } catch (error) {
      console.error('Error duplicating prompt:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate prompt",
        variant: "destructive",
      });
    }
  }, [user, toast, fetchSavedPrompts]);

  const handleRenamePrompt = useCallback(async (id: string, newTitle: string) => {
    if (!user || !newTitle) return;
    
    try {
      const { error } = await supabase
        .from('prompts')
        .update({ title: newTitle })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Prompt renamed successfully!",
      });
      
      fetchSavedPrompts();
    } catch (error) {
      console.error('Error renaming prompt:', error);
      toast({
        title: "Error",
        description: "Failed to rename prompt",
        variant: "destructive",
      });
    }
  }, [user, toast, fetchSavedPrompts]);

  const loadSavedPrompt = useCallback((prompt: any) => {
    setPromptText(prompt.prompt_text);
    setMasterCommand(prompt.master_command);
    setVariables(jsonToVariables(prompt.variables));
    setSelectedPrimary(prompt.primary_toggle);
    setSelectedSecondary(prompt.secondary_toggle);
    setFinalPrompt(prompt.prompt_text || "");
    setCurrentStep(3); // Go directly to step 3 when loading a saved prompt
    setIsViewingSavedPrompt(true);
    
    toast({
      title: "Prompt Loaded",
      description: "Your saved prompt has been loaded.",
    });
  }, [toast]);

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
        setDrafts(data.map(draft => ({
          id: draft.id,
          title: draft.title || 'Untitled Draft',
          promptText: draft.prompt_text || '',
          masterCommand: draft.master_command || '',
          primaryToggle: draft.primary_toggle,
          secondaryToggle: draft.secondary_toggle,
          variables: jsonToVariables(draft.variables),
          currentStep: draft.current_step || 1,
          updated_at: draft.updated_at
        })));
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setIsLoadingDrafts(false);
    }
  }, [user]);

  const saveDraft = useCallback(async () => {
    if (!user || !promptText.trim()) return;

    try {
      const title = promptText.split('\n')[0] || 'Untitled Draft';
      
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
      
      const draft = {
        user_id: user.id,
        title: title,
        prompt_text: promptText,
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

      fetchDrafts();
      
      toast({
        title: "Draft Saved",
        description: "Your progress has been saved as a draft.",
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft",
        variant: "destructive",
      });
    }
  }, [promptText, masterCommand, variables, selectedPrimary, selectedSecondary, currentStep, user, currentDraftId, fetchDrafts, toast]);

  const loadSelectedDraft = useCallback((draft: any) => {
    if (!draft) return;
    
    setPromptText(draft.promptText || "");
    setMasterCommand(draft.masterCommand || "");
    setVariables(draft.variables || []);
    setSelectedPrimary(draft.primaryToggle || null);
    setSelectedSecondary(draft.secondaryToggle || null);
    setCurrentStep(draft.currentStep || 1);
    setFinalPrompt(draft.promptText || "");
    
    if (draft.id) {
      setCurrentDraftId(draft.id);
    }
    
    toast({
      title: "Draft Loaded",
      description: "Your draft has been restored.",
    });
  }, [toast]);

  const handleDeleteDraft = useCallback(async (id: string) => {
    if (!user || !id) return;
    
    try {
      const { error } = await supabase
        .from('prompt_drafts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      if (id === currentDraftId) {
        setCurrentDraftId(null);
      }
      
      fetchDrafts();
      
      toast({
        title: "Draft Deleted",
        description: "Your draft has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive",
      });
    }
  }, [user, currentDraftId, fetchDrafts, toast]);

  // Load drafts when user changes
  useEffect(() => {
    if (user) {
      fetchDrafts();
      fetchSavedPrompts();
    }
  }, [user, fetchDrafts, fetchSavedPrompts]);

  return {
    promptText, setPromptText,
    questions, setQuestions,
    variables, setVariables,
    showJson, setShowJson,
    finalPrompt, setFinalPrompt,
    editingPrompt, setEditingPrompt,
    showEditPromptSheet, setShowEditPromptSheet,
    masterCommand, setMasterCommand,
    selectedPrimary, setSelectedPrimary,
    selectedSecondary, setSelectedSecondary,
    currentStep, setCurrentStep,
    savedPrompts, isLoadingPrompts, searchTerm, setSearchTerm,
    variableToDelete, setVariableToDelete,
    fetchSavedPrompts, handleNewPrompt, handleSavePrompt,
    handleDeletePrompt, handleDuplicatePrompt, handleRenamePrompt,
    loadSavedPrompt, isViewingSavedPrompt, setIsViewingSavedPrompt,
    saveDraft, drafts, isLoadingDrafts, currentDraftId,
    loadSelectedDraft, handleDeleteDraft
  };
};
