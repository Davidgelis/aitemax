
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
    console.log("Checking if can proceed to step 3...");
    
    // 1. Make sure all questions have been evaluated (answered or dismissed)
    const allQuestionsEvaluated = questions.every(
      (q) => q.isRelevant === true || q.isRelevant === false
    );
    
    // 2. For questions marked as relevant, make sure they have answers
    const allRelevantQuestionsAnswered = questions.every(
      (q) => !q.isRelevant || (q.isRelevant && q.answer && q.answer.trim() !== "")
    );
    
    // 3. For variables, we only care about the ones with names (not deleted)
    // Empty named variables are considered deleted/irrelevant
    const variablesWithNames = variables.filter(v => v.name.trim() !== '');
    
    // 4. Make sure all named variables have been explicitly marked as relevant or not relevant
    const allNamedVariablesEvaluated = variablesWithNames.length === 0 || 
      variablesWithNames.every(v => v.isRelevant === true || v.isRelevant === false);
    
    // Add comprehensive logging to help diagnose the issue
    console.log({
      allQuestionsEvaluated,
      allRelevantQuestionsAnswered,
      allNamedVariablesEvaluated,
      questionsCount: questions.length,
      variablesCount: variables.length,
      namedVariablesCount: variablesWithNames.length,
      questionsData: questions.map(q => ({
        id: q.id,
        isRelevant: q.isRelevant,
        hasAnswer: q.answer && q.answer.trim() !== ""
      })),
      variablesData: variablesWithNames.map(v => ({
        id: v.id,
        name: v.name,
        isRelevant: v.isRelevant
      }))
    });
    
    // We can proceed if:
    // 1. All questions are evaluated (relevant or not)
    // 2. All relevant questions have answers
    // 3. All named variables have been evaluated (relevant or not)
    return (
      allQuestionsEvaluated && 
      allRelevantQuestionsAnswered && 
      allNamedVariablesEvaluated
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
