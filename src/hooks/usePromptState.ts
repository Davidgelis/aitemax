
import { useState, useEffect, useCallback } from "react";
import { Question, Variable, SavedPrompt, variablesToJson, jsonToVariables, PromptJsonStructure, PromptTag } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { defaultVariables, mockQuestions, sampleFinalPrompt } from "@/components/dashboard/constants";
import { supabase } from "@/integrations/supabase/client";
import { usePromptDrafts } from "@/hooks/usePromptDrafts";
import { Json } from "@/integrations/supabase/types";

export const usePromptState = (user: any) => {
  const [promptText, setPromptText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionPage, setCurrentQuestionPage] = useState(0);
  const [variables, setVariables] = useState<Variable[]>(defaultVariables);
  const [showJson, setShowJson] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState(sampleFinalPrompt);
  const [editingPrompt, setEditingPrompt] = useState("");
  const [showEditPromptSheet, setShowEditPromptSheet] = useState(false);
  const [masterCommand, setMasterCommand] = useState("");
  // Changed these to null so all toggles are off by default
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isViewingSavedPrompt, setIsViewingSavedPrompt] = useState(false);
  const [promptJsonStructure, setPromptJsonStructure] = useState<PromptJsonStructure | null>(null);
  const [fetchPromptError, setFetchPromptError] = useState<Error | null>(null);
  // Removed draftLoaded state since we don't want to auto-load drafts

  const { toast } = useToast();

  const {
    saveDraft,
    loadDraft,
    clearDraft,
    drafts,
    isLoadingDrafts,
    fetchDrafts,
    deleteDraft,
    loadSelectedDraft,
    currentDraftId,
    isDirty,
    isSaving
  } = usePromptDrafts(
    promptText,
    masterCommand,
    variables,
    selectedPrimary,
    selectedSecondary,
    currentStep,
    user
  );

  // Removed the useEffect that auto-loads the draft on component mount

  const loadSelectedDraftState = (draft: any) => {
    const draftData = loadSelectedDraft(draft);
    
    // Only load if not for step 1
    if (draftData.currentStep && draftData.currentStep > 1) {
      if (draftData.promptText) setPromptText(draftData.promptText);
      if (draftData.masterCommand) setMasterCommand(draftData.masterCommand);
      if (draftData.variables) setVariables(draftData.variables);
      if (draftData.selectedPrimary) setSelectedPrimary(draftData.selectedPrimary);
      if (draftData.secondaryToggle) setSelectedSecondary(draftData.secondaryToggle);
      if (draftData.currentStep) setCurrentStep(draftData.currentStep);
      
      setFinalPrompt(draftData.promptText || "");
      
      toast({
        title: "Draft Loaded",
        description: "Your draft has been restored.",
      });
    }
  };

  const handleNewPrompt = () => {
    // Only save if it's a step 2 draft that hasn't been explicitly deleted
    // AND is not a saved prompt that's being viewed
    if (promptText && !isViewingSavedPrompt && currentStep === 2) {
      saveDraft();
      toast({
        title: "Draft Saved",
        description: "Your work has been saved as a draft.",
      });
    }
    
    setPromptText("");
    setQuestions([]);
    setVariables(defaultVariables.map(v => ({ ...v, value: "", isRelevant: null })));
    setFinalPrompt("");
    setMasterCommand("");
    setSelectedPrimary(null);
    setSelectedSecondary(null);
    setCurrentStep(1);
    setIsViewingSavedPrompt(false);
    
    toast({
      title: "New Prompt",
      description: "Started a new prompt creation process",
    });
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (deleteDraft) {
      await deleteDraft(draftId);
      
      // If the deleted draft was the current one, reset the state only if we're not on step 1
      if (draftId === currentDraftId && currentStep > 1) {
        setPromptText("");
        setMasterCommand("");
        setVariables(defaultVariables.map(v => ({ ...v, value: "", isRelevant: null })));
        setFinalPrompt("");
        setSelectedPrimary(null);
        setSelectedSecondary(null);
        setCurrentStep(1);
      }
    }
  };

  const fetchSavedPrompts = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingPrompts(true);
    setFetchPromptError(null);
    
    try {
      console.log("Fetching prompts for user:", user.id);
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log(`User has ${data?.length || 0} saved prompts`, data);
      
      const formattedPrompts: SavedPrompt[] = data?.map(item => {
        const prompt: SavedPrompt = {
          id: item.id,
          title: item.title || 'Untitled Prompt',
          date: new Date(item.created_at || '').toLocaleString(),
          promptText: item.prompt_text || '',
          masterCommand: item.master_command || '',
          primaryToggle: item.primary_toggle,
          secondaryToggle: item.secondary_toggle,
          variables: jsonToVariables(item.variables as Json),
        };
        
        return prompt;
      }) || [];
      
      setSavedPrompts(formattedPrompts);
    } catch (error: any) {
      console.error("Error fetching prompts:", error);
      setFetchPromptError(error);
      toast({
        title: "Error fetching prompts",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [user, toast]);

  const handleSavePrompt = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your prompts",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure we're saving plain text by removing any HTML tags if present
      const plainTextPrompt = finalPrompt.replace(/<[^>]*>/g, '');
      let jsonStructure = promptJsonStructure;
      
      if (!jsonStructure && plainTextPrompt) {
        setIsLoadingPrompts(true);
        try {
          const { data, error } = await supabase.functions.invoke('prompt-to-json', {
            body: {
              prompt: plainTextPrompt,
              masterCommand,
              userId: user.id
            }
          });
          
          if (error) throw error;
          
          if (data && data.jsonStructure) {
            jsonStructure = data.jsonStructure;
            setPromptJsonStructure(data.jsonStructure);
          }
        } catch (jsonError) {
          console.error("Error generating JSON for saving:", jsonError);
          // Continue saving without JSON structure
        } finally {
          setIsLoadingPrompts(false);
        }
      }
      
      // Generate tags for the prompt
      let generatedTags: PromptTag[] = [];
      try {
        setIsLoadingPrompts(true);
        toast({
          title: "Generating tags...",
          description: "Analyzing your prompt to generate relevant tags.",
        });
        
        const { data: tagsData, error: tagsError } = await supabase.functions.invoke('generate-prompt-tags', {
          body: {
            promptText: plainTextPrompt
          }
        });
        
        if (tagsError) {
          console.error("Error generating tags:", tagsError);
        } else if (tagsData && tagsData.tags) {
          // Ensure tags match the expected format
          if (Array.isArray(tagsData.tags)) {
            generatedTags = tagsData.tags as PromptTag[];
            console.log("Generated tags:", generatedTags);
          } else {
            console.error("Tags are not in the expected format:", tagsData.tags);
          }
        }
      } catch (tagsError) {
        console.error("Error invoking tags function:", tagsError);
      } finally {
        setIsLoadingPrompts(false);
      }
      
      const relevantVariables = variables.filter(v => v.isRelevant === true);
      const promptData = {
        user_id: user.id,
        title: plainTextPrompt.split('\n')[0] || 'Untitled Prompt',
        prompt_text: plainTextPrompt,
        master_command: masterCommand,
        primary_toggle: selectedPrimary,
        secondary_toggle: selectedSecondary,
        variables: variablesToJson(relevantVariables),
        current_step: currentStep,
        updated_at: new Date().toISOString(),
        tags: generatedTags as unknown as Json // Cast to Json for Supabase compatibility
      };

      const { data, error } = await supabase
        .from('prompts')
        .insert(promptData)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newPrompt: SavedPrompt = {
          id: data[0].id,
          title: data[0].title || 'Untitled Prompt',
          date: new Date(data[0].created_at || '').toLocaleString(),
          promptText: data[0].prompt_text || '',
          masterCommand: data[0].master_command || '',
          primaryToggle: data[0].primary_toggle,
          secondaryToggle: data[0].secondary_toggle,
          variables: jsonToVariables(data[0].variables as Json),
          tags: (data[0].tags as unknown as PromptTag[]) || [] // Safely cast to PromptTag[]
        };
        
        if (jsonStructure) {
          newPrompt.jsonStructure = jsonStructure;
        }
        
        setSavedPrompts(prevPrompts => [newPrompt, ...prevPrompts]);
      }

      await clearDraft();
      setIsViewingSavedPrompt(true);
      
      toast({
        title: "Success",
        description: "Prompt saved successfully with generated tags",
      });
    } catch (error: any) {
      console.error("Error saving prompt:", error.message);
      toast({
        title: "Error saving prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      const updatedPrompts = savedPrompts.filter(prompt => prompt.id !== id);
      setSavedPrompts(updatedPrompts);
      
      toast({
        title: "Success",
        description: "Prompt deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting prompt:", error.message);
      toast({
        title: "Error deleting prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDuplicatePrompt = async (prompt: SavedPrompt) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to duplicate prompts",
        variant: "destructive",
      });
      return;
    }

    try {
      const duplicateData = {
        user_id: user.id,
        title: `${prompt.title} (Copy)`,
        prompt_text: prompt.promptText,
        master_command: prompt.masterCommand,
        primary_toggle: prompt.primaryToggle,
        secondary_toggle: prompt.secondaryToggle,
        variables: variablesToJson(prompt.variables),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('prompts')
        .insert(duplicateData)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newPrompt: SavedPrompt = {
          id: data[0].id,
          title: data[0].title,
          date: new Date(data[0].created_at || '').toLocaleString(),
          promptText: data[0].prompt_text || '',
          masterCommand: data[0].master_command || '',
          primaryToggle: data[0].primary_toggle,
          secondaryToggle: data[0].secondary_toggle,
          variables: jsonToVariables(data[0].variables as Json),
        };
        
        if (prompt.jsonStructure) {
          newPrompt.jsonStructure = prompt.jsonStructure;
        }
        
        setSavedPrompts([newPrompt, ...savedPrompts]);
      }
      
      toast({
        title: "Success",
        description: "Prompt duplicated successfully",
      });
    } catch (error: any) {
      console.error("Error duplicating prompt:", error.message);
      toast({
        title: "Error duplicating prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRenamePrompt = async (id: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw error;
      }

      const updatedPrompts = savedPrompts.map(prompt =>
        prompt.id === id ? { ...prompt, title: newTitle } : prompt
      );
      setSavedPrompts(updatedPrompts);
      
      toast({
        title: "Success",
        description: "Prompt renamed successfully",
      });
    } catch (error: any) {
      console.error("Error renaming prompt:", error.message);
      toast({
        title: "Error renaming prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadSavedPrompt = (prompt: SavedPrompt) => {
    // Only save draft if it's not a saved prompt that's being viewed
    // and we're on step 2
    if (promptText && !isViewingSavedPrompt && currentStep === 2) {
      saveDraft();
    }
    
    console.log("Loading saved prompt:", prompt);
    // Ensure we're loading plain text
    const plainTextPrompt = prompt.promptText ? prompt.promptText.replace(/<[^>]*>/g, '') : "";
    setPromptText(plainTextPrompt);
    setFinalPrompt(plainTextPrompt);
    setMasterCommand(prompt.masterCommand || "");
    setSelectedPrimary(prompt.primaryToggle);
    setSelectedSecondary(prompt.secondaryToggle);
    
    if (prompt.jsonStructure) {
      setPromptJsonStructure(prompt.jsonStructure);
    } else {
      setPromptJsonStructure(null);
    }
    
    if (prompt.variables && prompt.variables.length > 0) {
      setVariables(prompt.variables);
    } else {
      setVariables(defaultVariables.map(v => ({ ...v, isRelevant: true })));
    }
    
    setCurrentStep(3);
    setIsViewingSavedPrompt(true);
    
    toast({
      title: "Prompt Loaded",
      description: `Loaded prompt: ${prompt.title}`,
    });
  };

  useEffect(() => {
    const saveDraftBeforeNavigate = (nextPath: string) => {
      // Only save draft if on step 2 (not step 1 or 3)
      if (nextPath !== location.pathname && 
          promptText && 
          !isViewingSavedPrompt && 
          currentStep === 2) {
        saveDraft();
      }
    };

    // For regular navigation
    const handleRouteChange = (e: PopStateEvent) => {
      const nextPath = window.location.pathname;
      if (nextPath !== location.pathname) {
        saveDraftBeforeNavigate(nextPath);
      }
    };

    // Add event listeners
    window.addEventListener('popstate', handleRouteChange);

    // Intercept Link navigation
    const originalPushState = window.history.pushState;
    window.history.pushState = function() {
      const nextPath = arguments[2] as string;
      saveDraftBeforeNavigate(nextPath);
      return originalPushState.apply(this, arguments as any);
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.history.pushState = originalPushState;
    };
  }, [location.pathname, promptText, isViewingSavedPrompt, saveDraft, currentStep]);

  useEffect(() => {
    if (user) {
      fetchSavedPrompts();
    }
  }, [user, fetchSavedPrompts]);

  return {
    promptText,
    setPromptText,
    questions,
    setQuestions,
    currentQuestionPage,
    setCurrentQuestionPage,
    variables,
    setVariables,
    showJson,
    setShowJson,
    finalPrompt,
    setFinalPrompt,
    editingPrompt,
    setEditingPrompt,
    showEditPromptSheet,
    setShowEditPromptSheet,
    masterCommand,
    setMasterCommand,
    selectedPrimary,
    setSelectedPrimary,
    selectedSecondary,
    setSelectedSecondary,
    currentStep,
    setCurrentStep,
    savedPrompts,
    setSavedPrompts,
    variableToDelete,
    setVariableToDelete,
    sliderPosition,
    setSliderPosition,
    searchTerm,
    setSearchTerm,
    isLoadingPrompts,
    isViewingSavedPrompt,
    setIsViewingSavedPrompt,
    promptJsonStructure,
    setPromptJsonStructure,
    fetchSavedPrompts,
    handleNewPrompt,
    handleSavePrompt,
    handleDeletePrompt,
    handleDuplicatePrompt,
    handleRenamePrompt,
    loadSavedPrompt,
    drafts,
    isLoadingDrafts,
    loadSelectedDraft: loadSelectedDraftState,
    deleteDraft,
    currentDraftId,
    handleDeleteDraft,
    saveDraft,
    isDirty,
    isSaving,
    fetchPromptError
  };
};
