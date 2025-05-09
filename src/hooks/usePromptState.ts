import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePromptDrafts } from "@/hooks/usePromptDrafts";
import { SavedPrompt, Variable } from "@/components/dashboard/types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { DRAFT_CFG } from '@/config/drafts';

interface PromptState {
  promptText: string;
  setPromptText: (text: string) => void;
  masterCommand: string;
  setMasterCommand: (command: string) => void;
  variables: Variable[];
  setVariables: (variables: Variable[]) => void;
  selectedPrimary: string | null;
  setSelectedPrimary: (toggle: string | null) => void;
  selectedSecondary: string | null;
  setSelectedSecondary: (toggle: string | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  savedPrompts: SavedPrompt[];
  isLoadingPrompts: boolean;
  fetchPromptError: Error | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredPrompts: SavedPrompt[];
  handleNewPrompt: () => void;
  handleDeletePrompt: (id: string) => void;
  handleDuplicatePrompt: (prompt: SavedPrompt) => void;
  handleRenamePrompt: (id: string, newTitle: string) => void;
  savePrompt: () => Promise<void>;
  loadSavedPrompt: (prompt: SavedPrompt) => void;
  isViewingSavedPrompt: boolean;
  currentPromptId: string | null;
  fetchSavedPrompts: () => Promise<void>;
  drafts: any[];
  isLoadingDrafts: boolean;
  loadSelectedDraft: (draft: any) => void;
  handleDeleteDraft: (id: string) => void;
  saveDraft: (force?: boolean) => void;
  currentDraftId: string | null;
  isDirty: boolean;
  isSaving: boolean;
}

export const usePromptState = (user: any = null): PromptState => {
  const [promptText, setPromptText] = useState<string>("");
  const [masterCommand, setMasterCommand] = useState<string>("");
  const [variables, setVariables] = useState<Variable[]>([]);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState<boolean>(false);
  const [fetchPromptError, setFetchPromptError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isViewingSavedPrompt, setIsViewingSavedPrompt] = useState<boolean>(false);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize the drafts hook with current state
  const {
    drafts,
    isLoadingDrafts,
    saveDraft,
    loadDraft,
    clearDraft,
    fetchDrafts,
    deleteDraft,
    loadSelectedDraft: loadDraft2,
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

  // Filter prompts based on search term
  const filteredPrompts = savedPrompts.filter(
    (prompt) => prompt.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch saved prompts from Supabase
  const fetchSavedPrompts = useCallback(async () => {
    if (!user) {
      setSavedPrompts([]);
      return;
    }

    setIsLoadingPrompts(true);
    setFetchPromptError(null);

    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching prompts:", error);
        setFetchPromptError(error);
        throw error;
      }

      if (data) {
        const formattedPrompts: SavedPrompt[] = data.map((prompt) => ({
          id: prompt.id,
          title: prompt.title || prompt.prompt_text?.split("\n")[0] || "Untitled",
          promptText: prompt.prompt_text || "",
          masterCommand: prompt.master_command || "",
          primaryToggle: prompt.primary_toggle,
          secondaryToggle: prompt.secondary_toggle,
          variables: prompt.variables || [],
          date: format(new Date(prompt.created_at), "MMM d, yyyy"),
        }));

        setSavedPrompts(formattedPrompts);
      }
    } catch (error) {
      console.error("Error in fetchSavedPrompts:", error);
      setFetchPromptError(error as Error);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [user]);

  // Load saved prompts when user changes
  useEffect(() => {
    if (user) {
      fetchSavedPrompts();
    } else {
      setSavedPrompts([]);
    }
  }, [user, fetchSavedPrompts]);

  // Handle creating a new prompt
  const handleNewPrompt = useCallback(() => {
    setPromptText("");
    setMasterCommand("");
    setVariables([]);
    setSelectedPrimary(null);
    setSelectedSecondary(null);
    setCurrentStep(1);
    setIsViewingSavedPrompt(false);
    setCurrentPromptId(null);
    clearDraft();
  }, [clearDraft]);

  // Handle deleting a prompt
  const handleDeletePrompt = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("prompts")
          .delete()
          .eq("id", id);

        if (error) throw error;

        setSavedPrompts((prev) => prev.filter((prompt) => prompt.id !== id));

        // If the deleted prompt is the current one, reset the state
        if (id === currentPromptId) {
          handleNewPrompt();
        }

        toast({
          title: "Prompt deleted",
          description: "Your prompt has been deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting prompt:", error);
        toast({
          title: "Error",
          description: "Failed to delete prompt. Please try again.",
          variant: "destructive",
        });
      }
    },
    [currentPromptId, handleNewPrompt, toast]
  );

  // Handle duplicating a prompt
  const handleDuplicatePrompt = useCallback(
    async (prompt: SavedPrompt) => {
      if (!user) {
        toast({
          title: "Not logged in",
          description: "Please log in to duplicate prompts.",
          variant: "destructive",
        });
        return;
      }

      try {
        const newPrompt = {
          id: uuidv4(),
          user_id: user.id,
          title: `${prompt.title} (Copy)`,
          prompt_text: prompt.promptText,
          master_command: prompt.masterCommand,
          primary_toggle: prompt.primaryToggle,
          secondary_toggle: prompt.secondaryToggle,
          variables: prompt.variables,
        };

        const { error } = await supabase.from("prompts").insert(newPrompt);

        if (error) throw error;

        // Add the new prompt to the local state
        const formattedPrompt: SavedPrompt = {
          id: newPrompt.id,
          title: newPrompt.title,
          promptText: newPrompt.prompt_text,
          masterCommand: newPrompt.master_command,
          primaryToggle: newPrompt.primary_toggle,
          secondaryToggle: newPrompt.secondary_toggle,
          variables: newPrompt.variables,
          date: format(new Date(), "MMM d, yyyy"),
        };

        setSavedPrompts((prev) => [formattedPrompt, ...prev]);

        toast({
          title: "Prompt duplicated",
          description: "Your prompt has been duplicated successfully.",
        });
      } catch (error) {
        console.error("Error duplicating prompt:", error);
        toast({
          title: "Error",
          description: "Failed to duplicate prompt. Please try again.",
          variant: "destructive",
        });
      }
    },
    [user, toast]
  );

  // Handle renaming a prompt
  const handleRenamePrompt = useCallback(
    async (id: string, newTitle: string) => {
      try {
        const { error } = await supabase
          .from("prompts")
          .update({ title: newTitle })
          .eq("id", id);

        if (error) throw error;

        setSavedPrompts((prev) =>
          prev.map((prompt) =>
            prompt.id === id ? { ...prompt, title: newTitle } : prompt
          )
        );

        // If this is the current prompt, update the current prompt ID
        if (id === currentPromptId) {
          setCurrentPromptId(id);
        }

        toast({
          title: "Prompt renamed",
          description: "Your prompt has been renamed successfully.",
        });
      } catch (error) {
        console.error("Error renaming prompt:", error);
        toast({
          title: "Error",
          description: "Failed to rename prompt. Please try again.",
          variant: "destructive",
        });
      }
    },
    [currentPromptId, toast]
  );

  // Save the current prompt
  const savePrompt = useCallback(async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to save prompts.",
        variant: "destructive",
      });
      return;
    }

    if (!promptText.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const title = promptText.split("\n")[0] || "Untitled";

      const promptData = {
        user_id: user.id,
        title,
        prompt_text: promptText,
        master_command: masterCommand,
        primary_toggle: selectedPrimary,
        secondary_toggle: selectedSecondary,
        variables,
      };

      let operation;
      let successMessage = "Prompt saved successfully!";

      if (isViewingSavedPrompt && currentPromptId) {
        // Update existing prompt
        operation = supabase
          .from("prompts")
          .update(promptData)
          .eq("id", currentPromptId);
        successMessage = "Prompt updated successfully!";
      } else {
        // Insert new prompt
        promptData.id = uuidv4();
        operation = supabase.from("prompts").insert(promptData);
        setCurrentPromptId(promptData.id);
      }

      const { error } = await operation;
      if (error) throw error;

      // Mark as viewing a saved prompt
      setIsViewingSavedPrompt(true);

      // Refresh the prompts list
      await fetchSavedPrompts();

      // Clear any draft since we've now saved the prompt
      clearDraft();

      toast({
        title: "Success",
        description: successMessage,
      });
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        title: "Error",
        description: "Failed to save prompt. Please try again.",
        variant: "destructive",
      });
    }
  }, [
    user,
    promptText,
    masterCommand,
    selectedPrimary,
    selectedSecondary,
    variables,
    isViewingSavedPrompt,
    currentPromptId,
    fetchSavedPrompts,
    clearDraft,
    toast,
  ]);

  // Load a saved prompt
  const loadSavedPrompt = useCallback((prompt: SavedPrompt) => {
    setPromptText(prompt.promptText);
    setMasterCommand(prompt.masterCommand);
    setVariables(prompt.variables || []);
    setSelectedPrimary(prompt.primaryToggle);
    setSelectedSecondary(prompt.secondaryToggle);
    setCurrentStep(2); // Always go to step 2 when loading a saved prompt
    setIsViewingSavedPrompt(true);
    setCurrentPromptId(prompt.id);
  }, []);

  // Handle loading a draft
  const loadSelectedDraft = useCallback(
    (draft: any) => {
      const loadedDraft = loadDraft2(draft);
      if (loadedDraft) {
        setPromptText(loadedDraft.promptText);
        setMasterCommand(loadedDraft.masterCommand);
        setVariables(loadedDraft.variables || []);
        setSelectedPrimary(loadedDraft.selectedPrimary);
        setSelectedSecondary(loadedDraft.secondaryToggle);
        setCurrentStep(loadedDraft.currentStep || 2);
        setIsViewingSavedPrompt(false);
        setCurrentPromptId(null);
      }
    },
    [loadDraft2]
  );

  // Handle deleting a draft
  const handleDeleteDraft = useCallback(
    (id: string) => {
      deleteDraft(id);
      // If this is the current draft, reset the state
      if (id === currentDraftId) {
        handleNewPrompt();
      }
    },
    [deleteDraft, currentDraftId, handleNewPrompt]
  );

  // auto-snapshot if user stops on step-3 but never presses "Save"
  useEffect(() => {
    if (currentStep === 3 && !isViewingSavedPrompt) {
      const id = setTimeout(() => saveDraft(false), DRAFT_CFG.SNAPSHOT_3_MS);
      return () => clearTimeout(id);
    }
  }, [currentStep, isViewingSavedPrompt, saveDraft]);

  return {
    promptText,
    setPromptText,
    masterCommand,
    setMasterCommand,
    variables,
    setVariables,
    selectedPrimary,
    setSelectedPrimary,
    selectedSecondary,
    setSelectedSecondary,
    currentStep,
    setCurrentStep,
    savedPrompts,
    isLoadingPrompts,
    fetchPromptError,
    searchTerm,
    setSearchTerm,
    filteredPrompts,
    handleNewPrompt,
    handleDeletePrompt,
    handleDuplicatePrompt,
    handleRenamePrompt,
    savePrompt,
    loadSavedPrompt,
    isViewingSavedPrompt,
    currentPromptId,
    fetchSavedPrompts,
    drafts,
    isLoadingDrafts,
    loadSelectedDraft,
    handleDeleteDraft,
    saveDraft,
    currentDraftId,
    isDirty,
    isSaving,
  };
};
