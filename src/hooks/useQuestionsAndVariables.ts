
import { useState, useEffect, useCallback } from "react";
import { Question, Variable } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useQuestionsAndVariables = (
  questions: Question[],
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>,
  variables: Variable[],
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>,
  variableToDelete: string | null,
  setVariableToDelete: React.Dispatch<React.SetStateAction<string | null>>,
  user?: any,
  promptId?: string | null
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

  const addVariable = useCallback(() => {
    const newVariableId = `v-${Date.now()}`;
    setVariables((current: Variable[]) => {
      const newCode = `VAR_${current.length + 1}`;
      return [
        ...current,
        {
          id: newVariableId,
          name: '',
          value: '',
          isRelevant: null,
          category: 'Custom',
          code: newCode // This will be used internally for matching in step 3
        }
      ];
    });
  }, [setVariables]);

  const removeVariable = useCallback((id: string = variableToDelete || "") => {
    const varId = id || variableToDelete;
    if (!varId) return;
    
    console.log(`Removing variable ${varId}`);
    setVariables(variables.filter((v) => v.id !== varId));
    
    if (id === variableToDelete) {
      setVariableToDelete(null);
    }
  }, [variables, variableToDelete, setVariables, setVariableToDelete]);

  const canProceedToStep3 = (): boolean => {
    return true;
  };

  const prepareDataForEnhancement = () => {
    console.log("PrepareDataForEnhancement - Starting with:", {
      questionCount: questions.length,
      variableCount: variables.length
    });
    
    // Log the initial state of questions and variables to help debugging
    console.log("Initial questions state:", questions.map(q => ({
      id: q.id,
      text: q.text?.substring(0, 30),
      isRelevant: q.isRelevant,
      hasAnswer: q.answer ? "yes" : "no",
      answerLength: q.answer?.length || 0
    })));
    
    console.log("Initial variables state:", variables.map(v => ({
      id: v.id,
      name: v.name,
      isRelevant: v.isRelevant,
      valueLength: v.value?.length || 0
    })));
    
    // Mark all unanswered or unreviewed questions as not relevant
    const updatedQuestions = questions.map(q => {
      // If question is unreviewed (null) or has no answer but is marked relevant
      if (q.isRelevant === null || (q.isRelevant === true && (!q.answer || q.answer.trim() === ""))) {
        console.log(`Marking question ${q.id} as not relevant (was: ${q.isRelevant}, answer: ${q.answer ? "present" : "missing"})`);
        return { ...q, isRelevant: false };
      }
      return q;
    });
    
    // Log the updated questions to see what changed
    console.log("Updated questions after preparing:", updatedQuestions.map(q => ({
      id: q.id,
      isRelevant: q.isRelevant,
      answerLength: q.answer?.length || 0
    })));
    
    // Mark all empty or unreviewed variables as not relevant
    const updatedVariables = variables.map(v => {
      // If variable is unreviewed (null) or has empty name/value but is marked relevant
      if (v.isRelevant === null || v.name.trim() === "" || v.value.trim() === "") {
        console.log(`Marking variable ${v.id} as not relevant (was: ${v.isRelevant}, name: "${v.name}", value: "${v.value}")`);
        return { ...v, isRelevant: false };
      }
      return v;
    });
    
    // Log the updated variables to see what changed
    console.log("Updated variables after preparing:", updatedVariables.map(v => ({
      id: v.id,
      name: v.name,
      isRelevant: v.isRelevant,
      valueLength: v.value?.length || 0
    })));
    
    // Update the state with these changes
    setQuestions(updatedQuestions);
    setVariables(updatedVariables);

    // Return the cleaned data
    return {
      updatedQuestions,
      updatedVariables
    };
  };

  const enhancePromptWithGPT = async (
    promptToEnhance: string, 
    primaryToggle: string | null, 
    secondaryToggle: string | null,
    setFinalPrompt: React.Dispatch<React.SetStateAction<string>>
  ): Promise<void> => {
    try {
      setIsEnhancing(true);
      
      // First, clean up data by marking unanswered questions and empty variables as not relevant
      const { updatedQuestions, updatedVariables } = prepareDataForEnhancement();
      
      // Filter out only answered and relevant questions
      const answeredQuestions = updatedQuestions.filter(
        q => q.isRelevant === true && q.answer && q.answer.trim() !== ""
      );
      
      // Filter out only relevant variables with values
      const relevantVariables = updatedVariables.filter(
        v => v.isRelevant === true && v.name.trim() !== "" && v.value.trim() !== ""
      );
      
      // Get selected template from the window object (added in StepOne.tsx)
      // @ts-ignore
      const selectedTemplate = window.__selectedTemplate || null;
      
      console.log("Calling enhance-prompt with:", {
        originalPrompt: promptToEnhance.substring(0, 50) + "...",
        answeredQuestionsCount: answeredQuestions.length,
        relevantVariablesCount: relevantVariables.length,
        primaryToggle,
        secondaryToggle,
        userId: user?.id ? "Present" : "None",
        promptId: promptId ? "Present" : "None",
        template: selectedTemplate ? selectedTemplate.name : "None"
      });
      
      // Log more detailed input data for debugging
      console.log("Sample answered questions:", answeredQuestions.slice(0, 2));
      console.log("Sample relevant variables:", relevantVariables.slice(0, 2));
      
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: {
          originalPrompt: promptToEnhance,
          answeredQuestions,
          relevantVariables,
          primaryToggle,
          secondaryToggle,
          userId: user?.id,
          promptId,
          template: selectedTemplate
        }
      });
      
      if (error) {
        console.error("Error from enhance-prompt edge function:", error);
        throw new Error(`Error enhancing prompt: ${error.message}`);
      }
      
      if (!data || !data.enhancedPrompt) {
        console.error("No enhancedPrompt in response data:", data);
        throw new Error("No enhanced prompt returned from the service");
      }
      
      console.log("Enhanced prompt received successfully:", data.enhancedPrompt.substring(0, 100) + "...");
      setFinalPrompt(data.enhancedPrompt);
    } catch (error) {
      console.error("Error enhancing prompt with GPT:", error);
      toast({
        title: "Error enhancing prompt",
        description: "An error occurred while enhancing your prompt. Please try again.",
        variant: "destructive",
      });
      
      // Set a fallback prompt to avoid blocking the user
      setFinalPrompt(`# Enhanced Prompt (Error Recovery)

${promptToEnhance}

Note: There was an error generating an enhanced version of your prompt. This is the original prompt you provided.`);
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
