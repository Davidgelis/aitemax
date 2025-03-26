import { useState, useEffect } from "react";
import { Question, Variable, UploadedImage } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

export const usePromptState = (user?: any) => {
  const [promptText, setPromptText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [masterCommand, setMasterCommand] = useState("");
  const [finalPrompt, setFinalPrompt] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [websiteData, setWebsiteData] = useState<{ url: string; instructions: string } | null>(null);
  const [smartContextData, setSmartContextData] = useState<{ context: string; usageInstructions: string } | null>(null);
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);

  // Add template-related state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");
  const [templates, setTemplates] = useState<any[]>([]);

  const toast = useToast().toast;

  const handleQuestionRelevance = (questionId: string, isRelevant: boolean) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId ? { ...q, isRelevant } : q
      )
    );
  };

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId ? { ...q, answer } : q
      )
    );
  };

  const handleVariableChange = (variableId: string, field: keyof Variable, content: string) => {
    setVariables(prevVariables =>
      prevVariables.map(v =>
        v.id === variableId ? { ...v, [field]: content } : v
      )
    );
  };

  const handleVariableRelevance = (variableId: string, isRelevant: boolean) => {
    setVariables(prevVariables =>
      prevVariables.map(v =>
        v.id === variableId ? { ...v, isRelevant } : v
      )
    );
  };

  const handleAddVariable = () => {
    const newVariable: Variable = {
      id: uuidv4(),
      name: "New Variable",
      value: "",
      isRelevant: null
    };
    setVariables(prevVariables => [...prevVariables, newVariable]);
  };

  const handleDeleteVariable = (id: string) => {
    setVariableToDelete(id);
  };

  const confirmDeleteVariable = () => {
    if (variableToDelete) {
      setVariables(prevVariables => prevVariables.filter(v => v.id !== variableToDelete));
      setVariableToDelete(null);
    }
  };

  const cancelDeleteVariable = () => {
    setVariableToDelete(null);
  };

  const canProceedToStep3 = questions.every(q => q.answer !== "" && q.isRelevant === true) && variables.every(v => v.value !== "" && v.isRelevant === true);

  // Function to handle template selection
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
  };

  // Initialize templates from XTemplatesList
  useEffect(() => {
    const initTemplates = async () => {
      try {
        // Import the default templates
        const { defaultTemplates } = await import("@/components/x-templates/XTemplatesList");
        setTemplates(defaultTemplates);
      } catch (error) {
        console.error("Error loading templates:", error);
      }
    };

    initTemplates();
  }, []);

  useEffect(() => {
    if (currentStep === 3) {
      if (!finalPrompt) {
        toast({
          title: "Error",
          description: "Final prompt is empty. Please go back to step 2 and try again.",
          variant: "destructive",
        });
        setCurrentStep(2);
      }
    }
  }, [currentStep, finalPrompt, toast]);

  return {
    promptText,
    setPromptText,
    questions,
    setQuestions,
    variables,
    setVariables,
    masterCommand,
    setMasterCommand,
    finalPrompt,
    setFinalPrompt,
    currentStep,
    setCurrentStep,
    uploadedImages,
    setUploadedImages,
    websiteData,
    setWebsiteData,
    smartContextData,
    setSmartContextData,
    handleQuestionRelevance,
    handleQuestionAnswer,
    handleVariableChange,
    handleVariableRelevance,
    handleAddVariable,
    handleDeleteVariable,
    variableToDelete,
    setVariableToDelete,
    confirmDeleteVariable,
    cancelDeleteVariable,
    canProceedToStep3,
    selectedPrimary,
    setSelectedPrimary,
    selectedSecondary,
    setSelectedSecondary,
    
    // Add template-related state and functions
    selectedTemplateId,
    setSelectedTemplateId,
    templates,
    handleSelectTemplate,
  };
};
