
import { useState, useEffect } from "react";
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

  // Debug variables whenever they change
  useEffect(() => {
    console.log("Variables in useQuestionsAndVariables:", variables);
  }, [variables]);

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
    console.log(`Updating variable ${variableId}, field: ${field}, value: ${value}`);
    
    // Create a new array with the updated variable
    const updatedVariables = variables.map((v) => {
      if (v.id === variableId) {
        // Create a new object with the updated field
        const updatedVar = { ...v, [field]: value };
        
        console.log("Variable before update:", v);
        console.log("Variable after update:", updatedVar);
        
        return updatedVar;
      }
      return v;
    });
    
    console.log("Updated variables array:", updatedVariables);
    
    // Update the state
    setVariables(updatedVariables);
  };

  const handleVariableRelevance = (variableId: string, isRelevant: boolean) => {
    console.log(`Setting variable ${variableId} relevance to:`, isRelevant);
    
    setVariables(
      variables.map((v) => {
        if (v.id === variableId) {
          console.log(`Updating relevance for ${v.name || 'unnamed variable'} to`, isRelevant);
          return { ...v, isRelevant };
        }
        return v;
      })
    );
  };

  const addVariable = () => {
    const newId = `v${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const newVariable: Variable = {
      id: newId,
      name: "",
      value: "",
      category: "Custom",
      isRelevant: true,
    };
    console.log("Adding new variable:", newVariable);
    setVariables([...variables, newVariable]);
  };

  const removeVariable = () => {
    if (!variableToDelete) return;
    
    console.log(`Removing variable ${variableToDelete}`);
    setVariables(variables.filter((v) => v.id !== variableToDelete));
    setVariableToDelete(null);
  };

  const canProceedToStep3 = (): boolean => {
    return true;
  };

  const prepareDataForEnhancement = () => {
    // Mark all unanswered or unreviewed questions as not relevant
    const updatedQuestions = questions.map(q => {
      if (q.isRelevant === null || (q.isRelevant === true && (!q.answer || q.answer.trim() === ""))) {
        return { ...q, isRelevant: false };
      }
      return q;
    });
    setQuestions(updatedQuestions);

    // Mark all empty or unreviewed variables as not relevant
    const updatedVariables = variables.map(v => {
      if (v.isRelevant === null || v.name.trim() === "" || v.value.trim() === "") {
        return { ...v, isRelevant: false };
      }
      return v;
    });
    setVariables(updatedVariables);

    // Return the cleaned data
    return {
      updatedQuestions,
      updatedVariables
    };
  };

  const enhancePromptWithGPT = async (
    originalPrompt: string,
    primaryToggle: string | null,
    secondaryToggle: string | null,
    setFinalPrompt: (prompt: string) => void
  ) => {
    setIsEnhancing(true);
    
    try {
      // Prepare data first - mark empty items as not relevant
      const { updatedQuestions, updatedVariables } = prepareDataForEnhancement();
      
      // Filter to only answered questions that are marked as relevant
      const answeredQuestions = updatedQuestions.filter(
        (q) => q.isRelevant && q.answer && q.answer.trim() !== ""
      );
      
      // Filter to only variables with both name and value that are marked as relevant
      const relevantVariables = updatedVariables.filter(
        (v) => v.isRelevant && v.name.trim() !== "" && v.value.trim() !== ""
      );
      
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
    isEnhancing,
    prepareDataForEnhancement
  };
};
