import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  SavedPrompt,
  Question,
  Variable,
  PromptTag,
  jsonToVariables,
} from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface UsePromptStateProps {
  initialPromptText?: string;
  initialMasterCommand?: string;
  initialPrimaryToggle?: string | null;
  initialSecondaryToggle?: string | null;
  initialQuestions?: Question[];
  initialVariables?: Variable[];
  initialTags?: PromptTag[];
}

export const usePromptState = ({
  initialPromptText = "",
  initialMasterCommand = "",
  initialPrimaryToggle = null,
  initialSecondaryToggle = null,
  initialQuestions = [],
  initialVariables = [],
  initialTags = [],
}: UsePromptStateProps = {}) => {
  const [promptText, setPromptText] = useState(initialPromptText);
  const [masterCommand, setMasterCommand] = useState(initialMasterCommand);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [primaryToggle, setPrimaryToggle] = useState<string | null>(
    initialPrimaryToggle
  );
  const [secondaryToggle, setSecondaryToggle] = useState<string | null>(
    initialSecondaryToggle
  );
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [variables, setVariables] = useState<Variable[]>(initialVariables);
  const [tags, setTags] = useState<PromptTag[]>(initialTags);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load initial state from session storage on mount
  useEffect(() => {
    const storedPromptText = sessionStorage.getItem("promptText");
    const storedMasterCommand = sessionStorage.getItem("masterCommand");
    const storedPrimaryToggle = sessionStorage.getItem("primaryToggle");
    const storedSecondaryToggle = sessionStorage.getItem("secondaryToggle");

    if (storedPromptText) setPromptText(storedPromptText);
    if (storedMasterCommand) setMasterCommand(storedMasterCommand);
    if (storedPrimaryToggle) setPrimaryToggle(storedPrimaryToggle);
    if (storedSecondaryToggle) setSecondaryToggle(storedSecondaryToggle);
  }, []);

  // Save state to session storage on changes
  useEffect(() => {
    sessionStorage.setItem("promptText", promptText);
    sessionStorage.setItem("masterCommand", masterCommand);
    sessionStorage.setItem("primaryToggle", primaryToggle || "");
    sessionStorage.setItem("secondaryToggle", secondaryToggle || "");
  }, [promptText, masterCommand, primaryToggle, secondaryToggle]);

  // Clear session storage on unmount
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("promptText");
      sessionStorage.removeItem("masterCommand");
      sessionStorage.removeItem("primaryToggle");
      sessionStorage.removeItem("secondaryToggle");
    };
  }, []);

  // Reset all prompt states
  const resetPromptState = () => {
    setPromptText("");
    setMasterCommand("");
    setFinalPrompt("");
    setPrimaryToggle(null);
    setSecondaryToggle(null);
    setQuestions([]);
    setVariables([]);
    setTags([]);
    setCurrentStep(1);
    setSelectedPromptId(null);
    setIsDraft(false);
    setIsSaving(false);
    setIsDeleting(false);
    setIsPrivate(true);
    setIsEnhanced(false);
    setSelectedTemplateId(null);
    setSelectedTemplate(null);
  };

  // Handling a restored prompt from the database or draft
  const handleRestoredPrompt = (prompt: any) => {
    const createdPrompt: SavedPrompt = {
      id: prompt.id,
      title: prompt.title,
      created_at: prompt.created_at || new Date().toISOString(),
      prompt_json: prompt.json_structure || { 
        promptText: "", 
        questions: [], 
        variables: [], 
        masterCommand: "", 
        finalPrompt: "",
        primaryToggle: null,
        secondaryToggle: null,
        tags: []
      },
      user_id: prompt.user_id || (user?.id || ""),
      tags: prompt.tags || [],
      date: new Date(prompt.created_at || Date.now()).toLocaleDateString(),
      promptText: prompt.prompt_text || prompt.promptText || "",
      masterCommand: prompt.master_command || prompt.masterCommand || "",
      primaryToggle: prompt.primary_toggle || prompt.primaryToggle || null,
      secondaryToggle: prompt.secondary_toggle || prompt.secondaryToggle || null,
      variables: jsonToVariables(prompt.variables || prompt.saved_variables || [])
    };

    setIsDraft(prompt.is_draft === true);
    return createdPrompt;
  };

  // Load a prompt by ID
  const loadPrompt = useCallback(
    async (promptId: string) => {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to load prompts.",
          variant: "destructive",
        });
        navigate("/auth?returnUrl=/dashboard");
        return;
      }

      try {
        const { data: prompt, error } = await supabase
          .from("prompts")
          .select("*")
          .eq("id", promptId)
          .eq("user_id", user.id)
          .single();

        if (error) {
          throw error;
        }

        if (prompt) {
          const restoredPrompt = handleRestoredPrompt(prompt);
          setSelectedPromptId(restoredPrompt.id);
          setPromptText(restoredPrompt.promptText || "");
          setMasterCommand(restoredPrompt.masterCommand || "");
          setFinalPrompt(restoredPrompt.prompt_json?.finalPrompt || "");
          setPrimaryToggle(restoredPrompt.primaryToggle || null);
          setSecondaryToggle(restoredPrompt.secondaryToggle || null);
          setQuestions(restoredPrompt.prompt_json?.questions || []);
          setVariables(restoredPrompt.variables || []);
          setTags(restoredPrompt.tags || []);
          setIsPrivate(restoredPrompt.is_private === true);
        } else {
          toast({
            title: "Prompt Not Found",
            description: "No prompt found with that ID.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error Loading Prompt",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [navigate, supabase, toast, user, handleRestoredPrompt]
  );

  // Save draft prompt
  const saveDraftPrompt = async (
    title: string = "Untitled Prompt",
    step: number = currentStep,
    isPrivate: boolean = true
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save prompts.",
        variant: "destructive",
      });
      return null;
    }

    const draftPrompt = {
      id: selectedPromptId || crypto.randomUUID(),
      title: title,
      date: new Date().toLocaleDateString(),
      promptText: promptText,
      masterCommand: masterCommand,
      primaryToggle: primaryToggle,
      secondaryToggle: secondaryToggle,
      variables: variables,
      tags: tags,
      created_at: new Date().toISOString(),
      prompt_json: {
        promptText,
        questions,
        variables,
        masterCommand,
        finalPrompt,
        primaryToggle,
        secondaryToggle,
        tags
      },
      user_id: user.id
    } as SavedPrompt;

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from("prompts")
        .upsert([
          {
            id: draftPrompt.id,
            created_at: draftPrompt.created_at,
            updated_at: new Date().toISOString(),
            title: draftPrompt.title,
            prompt_text: draftPrompt.promptText,
            master_command: draftPrompt.masterCommand,
            primary_toggle: draftPrompt.primaryToggle,
            secondary_toggle: draftPrompt.secondaryToggle,
            variables: draftPrompt.variables,
            json_structure: draftPrompt.prompt_json,
            user_id: draftPrompt.user_id,
            is_draft: true,
            is_private: isPrivate,
            tags: draftPrompt.tags,
            current_step: step,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setSelectedPromptId(draftPrompt.id);
      setIsDraft(true);

      toast({
        title: "Draft Saved",
        description: "Your prompt has been saved as a draft.",
      });

      return draftPrompt;
    } catch (error: any) {
      toast({
        title: "Error Saving Draft",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Save the prompt to database
  const savePrompt = async (
    title: string = "Untitled Prompt",
    isPrivate: boolean = true
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save prompts.",
        variant: "destructive",
      });
      return null;
    }

    const promptToSave = {
      id: selectedPromptId || crypto.randomUUID(),
      title: title,
      date: new Date().toLocaleDateString(),
      promptText: promptText,
      masterCommand: masterCommand,
      primaryToggle: primaryToggle,
      secondaryToggle: secondaryToggle,
      variables: variables,
      created_at: new Date().toISOString(),
      prompt_json: {
        promptText,
        questions,
        variables,
        masterCommand,
        finalPrompt,
        primaryToggle,
        secondaryToggle,
        tags
      },
      user_id: user.id,
      tags: tags
    } as SavedPrompt;

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from("prompts")
        .upsert([
          {
            id: promptToSave.id,
            created_at: promptToSave.created_at,
            updated_at: new Date().toISOString(),
            title: title,
            prompt_text: promptText,
            master_command: masterCommand,
            primary_toggle: primaryToggle,
            secondary_toggle: secondaryToggle,
            variables: variables,
            json_structure: promptToSave.prompt_json,
            user_id: user.id,
            is_draft: false,
            is_private: isPrivate,
            tags: tags,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setSelectedPromptId(promptToSave.id);
      setIsDraft(false);

      toast({
        title: "Prompt Saved",
        description: "Your prompt has been saved.",
      });

      return promptToSave;
    } catch (error: any) {
      toast({
        title: "Error Saving Prompt",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a prompt by ID
  const deletePrompt = async (promptId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete prompts.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", promptId)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      resetPromptState();

      toast({
        title: "Prompt Deleted",
        description: "The prompt has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error Deleting Prompt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    promptText,
    setPromptText,
    masterCommand,
    setMasterCommand,
    finalPrompt,
    setFinalPrompt,
    primaryToggle,
    setPrimaryToggle,
    secondaryToggle,
    setSecondaryToggle,
    questions,
    setQuestions,
    variables,
    setVariables,
    tags,
    setTags,
    currentStep,
    setCurrentStep,
    selectedPromptId,
    setSelectedPromptId,
    isDraft,
    setIsDraft,
    isSaving,
    isDeleting,
    isPrivate,
    setIsPrivate,
    isEnhanced,
    setIsEnhanced,
    selectedTemplateId,
    setSelectedTemplateId,
    selectedTemplate,
    setSelectedTemplate,
    resetPromptState,
    loadPrompt,
    saveDraftPrompt,
    savePrompt,
    deletePrompt,
    handleRestoredPrompt
  };
};
