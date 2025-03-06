import { useState } from "react";
import { Question, Variable, SavedPrompt, variablesToJson, jsonToVariables, PromptJsonStructure } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { defaultVariables, mockQuestions, sampleFinalPrompt } from "@/components/dashboard/constants";
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>("coding");
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>("strict");
  const [currentStep, setCurrentStep] = useState(1);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isViewingSavedPrompt, setIsViewingSavedPrompt] = useState(false);
  const [promptJsonStructure, setPromptJsonStructure] = useState<PromptJsonStructure | null>(null);
  const { toast } = useToast();

  const fetchSavedPrompts = async () => {
    if (!user) return;
    
    setIsLoadingPrompts(true);
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const formattedPrompts: SavedPrompt[] = data?.map(item => ({
        id: item.id,
        title: item.title || 'Untitled Prompt',
        date: new Date(item.created_at || '').toLocaleString(),
        promptText: item.prompt_text || '',
        masterCommand: item.master_command || '',
        primaryToggle: item.primary_toggle,
        secondaryToggle: item.secondary_toggle,
        variables: jsonToVariables(item.variables),
      })) || [];
      
      setSavedPrompts(formattedPrompts);
    } catch (error: any) {
      console.error("Error fetching prompts:", error.message);
      toast({
        title: "Error fetching prompts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const handleNewPrompt = () => {
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
      // First, get the JSON structure if not already available
      let jsonStructure = promptJsonStructure;
      
      if (!jsonStructure && finalPrompt) {
        setIsLoadingPrompts(true);
        try {
          const { data, error } = await supabase.functions.invoke('prompt-to-json', {
            body: {
              prompt: finalPrompt,
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
      
      const relevantVariables = variables.filter(v => v.isRelevant === true);
      const promptData = {
        user_id: user.id,
        title: finalPrompt.split('\n')[0] || 'Untitled Prompt',
        prompt_text: finalPrompt,
        master_command: masterCommand,
        primary_toggle: selectedPrimary,
        secondary_toggle: selectedSecondary,
        variables: variablesToJson(relevantVariables),
        json_structure: jsonStructure as any,
        current_step: currentStep,
        updated_at: new Date().toISOString()
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
          variables: jsonToVariables(data[0].variables),
          jsonStructure: data[0].json_structure as PromptJsonStructure
        };
        
        // Update savedPrompts state to include the new prompt at the beginning
        setSavedPrompts(prevPrompts => [newPrompt, ...prevPrompts]);
      }

      toast({
        title: "Success",
        description: "Prompt saved successfully with JSON structure",
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
          variables: jsonToVariables(data[0].variables),
          jsonStructure: data[0].json_structure as PromptJsonStructure
        };
        
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
    console.log("Loading saved prompt:", prompt);
    // Ensure all necessary data is loaded
    setPromptText(prompt.promptText || "");
    setFinalPrompt(prompt.promptText || "");
    setMasterCommand(prompt.masterCommand || "");
    setSelectedPrimary(prompt.primaryToggle);
    setSelectedSecondary(prompt.secondaryToggle);
    
    // Set the JSON structure if available
    if (prompt.jsonStructure) {
      setPromptJsonStructure(prompt.jsonStructure);
    } else {
      setPromptJsonStructure(null);
    }
    
    // Make sure we have variables - if they're missing, use default ones
    if (prompt.variables && prompt.variables.length > 0) {
      setVariables(prompt.variables);
    } else {
      // Set default variables but mark them all as relevant
      setVariables(defaultVariables.map(v => ({ ...v, isRelevant: true })));
    }
    
    // Go directly to step 3 and mark as viewing saved prompt
    setCurrentStep(3);
    setIsViewingSavedPrompt(true);
    
    toast({
      title: "Prompt Loaded",
      description: `Loaded prompt: ${prompt.title}`,
    });
  };

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
    loadSavedPrompt
  };
};
