
import { supabase } from "@/integrations/supabase/client";

export const ModelEnhancementService = {
  async enhanceModelsWithAI(): Promise<boolean> {
    try {
      console.log('Enhancing all non-deleted AI models with concise AI-generated information...');
      const response = await supabase.functions.invoke('enhance-ai-models', {
        method: 'POST'
      });
      
      if (response.error) {
        console.error('Error from AI enhancement edge function:', response.error);
        throw response.error;
      }
      
      console.log('Model AI enhancement response:', response.data);
      return response.data.success;
    } catch (error) {
      console.error('Error enhancing models with AI:', error);
      return false;
    }
  }
};
