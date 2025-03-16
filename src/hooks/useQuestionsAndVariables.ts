
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
    promptToEnhance: string, 
    primaryToggle: string | null, 
    secondaryToggle: string | null,
    setFinalPrompt: React.Dispatch<React.SetStateAction<string>>
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
      
      console.log("Calling enhance-prompt with o3-mini for model...");
      
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: {
          originalPrompt: promptToEnhance,
          answeredQuestions,
          relevantVariables,
          primaryToggle,
          secondaryToggle,
          userId: user?.id,
          promptId,
          model: 'o3-mini' // Explicitly specify o3-mini model
        }
      });
      
      if (error) {
        console.error("Error from enhance-prompt function:", error);
        throw error;
      }
      
      if (!data || !data.enhancedPrompt) {
        throw new Error("Invalid response from enhance-prompt function");
      }
      
      setFinalPrompt(data.enhancedPrompt);
    } catch (error) {
      console.error("Error enhancing prompt with GPT:", error);
      
      // Create a direct fallback enhanced prompt
      const fallbackPrompt = `# Enhanced Prompt (Manual Enhancement)

${promptToEnhance}

## Additional Context
${questions
  .filter(q => q.answer && q.answer.trim() !== "" && q.isRelevant !== false)
  .map(q => `- ${q.question}: ${q.answer}`)
  .join('\n')}

## Variables
${variables
  .filter(v => v.isRelevant === true)
  .map(v => `- ${v.name}: ${v.value || '{{' + v.name + '}}'} `)
  .join('\n')}
`;

      setFinalPrompt(fallbackPrompt);
      
      toast({
        title: "Used fallback enhancement",
        description: "Created a basic enhanced prompt due to API error. You can edit it directly.",
        variant: "destructive",
      });
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
