
import { useState } from "react";
import { Question, Variable } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useQuestionsAndVariables = (
  questions: Question[],
  setQuestions: (questions: Question[]) => void,
  variables: Variable[],
  setVariables: (variables: Variable[]) => void,
  variableToDelete: string | null,
  setVariableToDelete: (id: string | null) => void,
  user: any = null,
  promptId: string | null = null
) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, answer } : q))
    );
  };

  const handleQuestionRelevance = (questionId: string, isRelevant: boolean) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, isRelevant } : q))
    );
  };

  const handleVariableChange = (
    variableId: string,
    field: keyof Variable,
    value: string
  ) => {
    setVariables(
      variables.map((v) => (v.id === variableId ? { ...v, [field]: value } : v))
    );
  };

  const handleVariableRelevance = (variableId: string, isRelevant: boolean) => {
    setVariables(
      variables.map((v) => (v.id === variableId ? { ...v, isRelevant } : v))
    );
  };

  const addVariable = () => {
    const newId = `v${variables.length + 1}`;
    const newVariable: Variable = {
      id: newId,
      name: "",
      value: "",
      category: "Custom",
      isRelevant: true,
    };
    setVariables([...variables, newVariable]);
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
    setVariableToDelete(null);
  };

  const canProceedToStep3 = (): boolean => {
    // Make sure all questions have been marked as relevant or not
    const allQuestionsEvaluated = questions.every(
      (q) => q.isRelevant === true || q.isRelevant === false
    );

    // Make sure all variables have been marked as relevant or not
    const allVariablesEvaluated = variables.every(
      (v) => v.isRelevant === true || v.isRelevant === false
    );

    // Make sure all relevant questions have answers
    const allRelevantQuestionsAnswered = questions.every(
      (q) => !q.isRelevant || (q.isRelevant && q.answer && q.answer.trim() !== "")
    );

    return (
      allQuestionsEvaluated && allVariablesEvaluated && allRelevantQuestionsAnswered
    );
  };

  const enhancePromptWithGPT = async (
    originalPrompt: string,
    primaryToggle: string | null,
    secondaryToggle: string | null,
    setFinalPrompt: (prompt: string) => void
  ) => {
    setIsEnhancing(true);
    
    try {
      // Get all answered and relevant questions
      const answeredQuestions = questions.filter(
        (q) => q.isRelevant && q.answer && q.answer.trim() !== ""
      );
      
      // Get all relevant variables
      const relevantVariables = variables.filter((v) => v.isRelevant);
      
      // Create payload for enhance-prompt function
      const payload: any = {
        originalPrompt,
        answeredQuestions,
        relevantVariables,
        primaryToggle,
        secondaryToggle
      };
      
      // Add user and prompt ID if available
      if (user) {
        payload.userId = user.id;
      }
      
      if (promptId) {
        payload.promptId = promptId;
      }
      
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: payload
      });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Set the enhanced prompt text
        setFinalPrompt(data.enhancedPrompt);
        
        // Log token usage if available
        if (data.usage) {
          console.log("Generate prompt token usage:", data.usage);
          console.log(`Prompt tokens: ${data.usage.prompt_tokens}, Completion tokens: ${data.usage.completion_tokens}`);
        }
        
        return data.enhancedPrompt;
      } else {
        throw new Error("No data returned from enhance-prompt function");
      }
    } catch (error) {
      console.error("Error enhancing prompt with GPT:", error);
      toast({
        title: "Error",
        description: "There was an error enhancing your prompt. A basic prompt has been generated.",
        variant: "destructive",
      });
      
      // Generate a simple default prompt using the original text
      const defaultPrompt = `# Enhanced Prompt\n\n${originalPrompt}`;
      setFinalPrompt(defaultPrompt);
      return defaultPrompt;
    } finally {
      setIsEnhancing(false);
    }
  };

  return {
    handleQuestionAnswer,
    handleQuestionRelevance,
    handleVariableChange,
    handleVariableRelevance,
    addVariable,
    removeVariable,
    canProceedToStep3,
    enhancePromptWithGPT,
    isEnhancing
  };
};
