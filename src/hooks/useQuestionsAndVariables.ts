import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable } from "@/components/dashboard/types";

export const useQuestionsAndVariables = (
  questions: Question[],
  setQuestions: (questions: Question[]) => void,
  variables: Variable[],
  setVariables: (variables: Variable[]) => void,
  variableToDelete: string | null,
  setVariableToDelete: (id: string | null) => void,
  user: any,
  promptId: string | null
) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancingError, setEnhancingError] = useState<string | null>(null);
  
  // Question handling functions
  const handleQuestionAnswer = (id: string, answer: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, answer, hasBeenAnswered: true } : q
      )
    );
  };

  const handleQuestionRelevance = (id: string, isRelevant: boolean) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, isRelevant } : q
      )
    );
  };

  // Variable handling functions
  const handleVariableChange = (id: string, field: keyof Variable, content: string) => {
    setVariables(
      variables.map((v) =>
        v.id === id ? { ...v, [field]: content } : v
      )
    );
  };

  const handleVariableRelevance = (id: string, isRelevant: boolean) => {
    setVariables(
      variables.map((v) =>
        v.id === id ? { ...v, isRelevant } : v
      )
    );
  };

  const addVariable = () => {
    const newVariable: Variable = {
      id: `var-${Date.now()}`,
      name: '',
      value: '',
      category: 'Other', 
      code: '', 
      isRelevant: true
    };
    setVariables([...variables, newVariable]);
  };

  // This function will be called with no arguments by the components
  // but needs to use the variableToDelete value from the parent state
  const removeVariable = () => {
    if (variableToDelete) {
      console.log(`Removing variable with id: ${variableToDelete}`);
      setVariables(variables.filter(v => v.id !== variableToDelete));
      setVariableToDelete(null);
    } else {
      console.warn("Attempted to remove variable but no variable was selected for deletion");
    }
  };

  // Check if all required questions have been answered and we can proceed to step 3
  const canProceedToStep3 = () => {
    const relevantQuestions = questions.filter(q => q.isRelevant !== false);
    const allQuestionsAnswered = relevantQuestions.every(q => q.answer?.trim());

    // Must have at least one relevant variable OR question set
    const hasUsefulData =
      variables.some(v => v.isRelevant !== false) || relevantQuestions.length;

    // If there are zero questions we treat "answers complete" as true
    return hasUsefulData && (relevantQuestions.length === 0 || allQuestionsAnswered);
  };

  // Implementation for qvEnhancePromptWithGPT
  const enhancePromptWithGPT = async (
    originalPrompt: string,
    answeredQuestions: Question[],
    relevantVariables: Variable[],
    setFinalPrompt: (prompt: string) => void
  ) => {
    setIsEnhancing(true);
    setEnhancingError(null);
    
    try {
      const enhancedPrompt = await enhancePromptWithTemplate(
        originalPrompt,
        answeredQuestions,
        relevantVariables,
        null, // primaryToggle
        null, // secondaryToggle
        user,
        promptId,
        null // template
      );
      
      if (enhancedPrompt) {
        setFinalPrompt(enhancedPrompt);
      }
      
      return true;
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      setEnhancingError(error instanceof Error ? error.message : 'Unknown error enhancing prompt');
      return false;
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
    enhancingError
  };
};

// Keep the existing enhancePromptWithTemplate function
export const enhancePromptWithTemplate = async (
  promptToEnhance: string,
  answeredQuestions: Question[],
  relevantVariables: Variable[],
  primaryToggle: string | null,
  secondaryToggle: string | null,
  user: any,
  promptId: string | null,
  template: any | null
): Promise<string | null> => {
  try {
    console.log(`Enhancing prompt template with ${answeredQuestions.length} questions and ${relevantVariables.length} variables`);
    
    if (!promptToEnhance) {
      console.error('No prompt to enhance');
      return null;
    }
    
    // Clone template to avoid mutating the original
    const templateCopy = template ? { ...template } : null;
    
    // Clean template of any non-serializable fields
    if (templateCopy) {
      delete templateCopy.draftId;
      delete templateCopy.status;
      delete templateCopy.isDefault;
      delete templateCopy.created_at;
      delete templateCopy.updated_at;
      delete templateCopy.__typename;
    }
    
    // Create payload and let supabase client handle serialization
    const payload = {
      originalPrompt: promptToEnhance,
      answeredQuestions,
      relevantVariables,
      primaryToggle,
      secondaryToggle,
      userId: user?.id,
      promptId,
      template: templateCopy // Pass the clean template copy
    };
    
    const { data, error } = await supabase.functions.invoke(
      'enhance-prompt',
      { body: payload }
    );
    
    if (error) {
      console.error('Error enhancing prompt:', error);
      throw new Error(error.message);
    }
    
    console.log('Prompt enhanced successfully');
    return data?.enhancedPrompt || null;
  } catch (error) {
    console.error('Error in enhancePromptWithTemplate:', error);
    return null;
  }
};
