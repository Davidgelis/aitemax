
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
  
  // Debug questions whenever they change, especially image-based ones
  useEffect(() => {
    const imageQuestions = questions.filter(q => q.contextSource === "image" || q.category === "Image Analysis");
    if (imageQuestions.length > 0) {
      console.log("Image-based questions:", imageQuestions.length);
      imageQuestions.forEach(q => console.log(`- ${q.text.substring(0, 50)}...`));
    }
  }, [questions]);

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          // Remove automatic relevance setting, only update answer
          return { ...q, answer };
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

  /**
   * Enhanced prompt with GPT, now with standardized parameter order to match usePromptAnalysis.ts
   * @param promptToEnhance The original prompt text to enhance
   * @param primaryToggle Selected primary toggle
   * @param secondaryToggle Selected secondary toggle
   * @param setFinalPrompt Callback to set the final prompt
   * @param selectedTemplate The selected template to use
   */
  const enhancePromptWithGPT = async (
    promptToEnhance: string, 
    primaryToggle: string | null, 
    secondaryToggle: string | null,
    setFinalPrompt: React.Dispatch<React.SetStateAction<string>>,
    selectedTemplate: any = null
  ): Promise<void> => {
    try {
      setIsEnhancing(true);
      
      // Filter out only answered and relevant questions
      const answeredQuestions = questions.filter(
        q => q.answer && q.answer.trim() !== "" && q.isRelevant !== false
      );
      
      // Filter out only relevant variables
      const relevantVariables = variables.filter(
        v => v.isRelevant === true
      );
      
      // Enhanced template validation
      const isValidTemplate = selectedTemplate && 
                             typeof selectedTemplate === 'object' && 
                             selectedTemplate.name && 
                             Array.isArray(selectedTemplate.pillars) &&
                             selectedTemplate.pillars.length > 0 &&
                             selectedTemplate.pillars.every(p => p && p.title && p.description);
      
      console.log("useQuestionsAndVariables: Template being used:", 
        isValidTemplate ? {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          pillarsCount: selectedTemplate.pillars.length,
          temperature: selectedTemplate.temperature
        } : "Invalid or no template");
      
      if (!isValidTemplate && selectedTemplate) {
        console.error("Invalid template structure:", JSON.stringify(selectedTemplate, null, 2));
      }
      
      // Always create a deep copy to prevent reference issues
      let templateCopy = null;
      if (selectedTemplate && isValidTemplate) {
        try {
          templateCopy = JSON.parse(JSON.stringify(selectedTemplate));
          console.log("Template successfully copied:", templateCopy.name);
        } catch (copyError) {
          console.error("Error creating template copy:", copyError);
          // Continue without template if copy fails
        }
      }
      
      console.log("useQuestionsAndVariables: Calling enhance-prompt with:", {
        originalPrompt: promptToEnhance.substring(0, 50) + "...",
        answeredQuestions: answeredQuestions.length,
        relevantVariables: relevantVariables.length,
        primaryToggle,
        secondaryToggle,
        userId: user?.id ? "Present" : "None",
        promptId: promptId ? "Present" : "None",
        template: templateCopy ? templateCopy.name : "None"
      });
      
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: {
          originalPrompt: promptToEnhance,
          answeredQuestions,
          relevantVariables,
          primaryToggle,
          secondaryToggle,
          userId: user?.id,
          promptId,
          template: templateCopy // Pass the clean template copy
        }
      });
      
      if (error) {
        console.error("Error from enhance-prompt edge function:", error);
        throw new Error(`Error enhancing prompt: ${error.message}`);
      }
      
      if (!data || !data.enhancedPrompt) {
        console.error("No enhanced prompt returned from edge function");
        throw new Error("No enhanced prompt returned");
      }
      
      console.log("Enhanced prompt received (length):", data.enhancedPrompt.length);
      setFinalPrompt(data.enhancedPrompt);
      
    } catch (error) {
      console.error("Error in enhancePromptWithGPT:", error);
      throw error;
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
