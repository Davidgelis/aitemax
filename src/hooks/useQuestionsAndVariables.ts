// Only updating the enhancePromptWithTemplate function to match our approach
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable } from "@/components/dashboard/types";

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
    
    // Clean template and consolidate its form before sending
    if (templateCopy) {
      // Clean template of any non-serializable fields
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
