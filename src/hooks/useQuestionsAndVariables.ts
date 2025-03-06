
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
      questions.map((q) => {
        if (q.id === questionId) {
          // When an answer is provided, automatically mark as relevant
          return { ...q, answer, isRelevant: answer.trim() !== "" };
        }
        return q;
      })
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
      variables.map((v) => {
        if (v.id === variableId) {
          // When a value is provided for name or value, automatically mark as relevant
          const isRelevant = field === 'name' || field === 'value' 
            ? value.trim() !== "" 
            : v.isRelevant;
          
          return { ...v, [field]: value, isRelevant };
        }
        return v;
      })
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
    
    // 1. Check if all questions have been evaluated (marked as relevant or not)
    const allQuestionsEvaluated = questions.every(q => 
      q.isRelevant === true || q.isRelevant === false
    );
    
    // 2. Check if all relevant questions have answers
    const allRelevantQuestionsAnswered = questions.every(q => 
      !q.isRelevant || (q.isRelevant && q.answer && q.answer.trim() !== "")
    );
    
    // 3. Only check variables that have names (ignore empty variables)
    const namedVariables = variables.filter(v => v.name.trim() !== '');
    
    // 4. Check if all named variables have been evaluated
    const allNamedVariablesEvaluated = namedVariables.every(v => 
      v.isRelevant === true || v.isRelevant === false
    );
    
    console.log({
      allQuestionsEvaluated,
      allRelevantQuestionsAnswered,
      allNamedVariablesEvaluated,
      questionsCount: questions.length,
      namedVariablesCount: namedVariables.length,
      questionsData: questions.map(q => ({
        id: q.id,
        isRelevant: q.isRelevant,
        hasAnswer: q.answer && q.answer.trim() !== ""
      })),
      variablesData: namedVariables.map(v => ({
        id: v.id,
        name: v.name,
        isRelevant: v.isRelevant
      }))
    });
    
    // All conditions must be true to proceed
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
      const answeredQuestions = questions.filter(
        (q) => q.isRelevant && q.answer && q.answer.trim() !== ""
      );
      
      const relevantVariables = variables.filter((v) => v.isRelevant);
      
      const payload: any = {
        originalPrompt,
        answeredQuestions,
        relevantVariables,
        primaryToggle,
        secondaryToggle
      };
      
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
        setFinalPrompt(data.enhancedPrompt);
        
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
