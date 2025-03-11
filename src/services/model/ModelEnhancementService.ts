
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ModelEnhancementService = {
  async enhanceModelsWithAI(): Promise<boolean> {
    try {
      console.log('Enhancing all non-deleted AI models with concise AI-generated information...');
      const response = await supabase.functions.invoke('enhance-ai-models', {
        method: 'POST'
      });
      
      if (response.error) {
        console.error('Error from AI enhancement edge function:', response.error);
        toast.error('Error enhancing models', {
          description: response.error.message || 'Unknown error'
        });
        throw response.error;
      }
      
      console.log('Model AI enhancement response:', response.data);
      toast.success('Models enhanced successfully');
      return response.data.success;
    } catch (error) {
      console.error('Error enhancing models with AI:', error);
      toast.error('Error enhancing models', {
        description: (error as Error).message || 'Unknown error'
      });
      return false;
    }
  },

  async testApiConnection(): Promise<boolean> {
    try {
      console.log('Testing OpenAI API connection...');
      const response = await supabase.functions.invoke('test-api-connection', {
        method: 'POST'
      });
      
      if (response.error) {
        console.error('Error testing API connection:', response.error);
        toast.error('API Connection Failed', {
          description: response.error.message || 'Unknown error'
        });
        return false;
      }
      
      console.log('API connection test result:', response.data);
      
      if (response.data?.success) {
        toast.success('API Connection Successful', {
          description: `Connected to ${response.data.model || "OpenAI API"} (${response.data.tokenCount || 0} tokens used)`
        });
        return true;
      } else {
        toast.error('API Connection Failed', {
          description: response.data?.message || 'Unknown error'
        });
        return false;
      }
    } catch (error) {
      console.error('Error testing API connection:', error);
      toast.error('API Connection Error', {
        description: (error as Error).message || 'Unknown error'
      });
      return false;
    }
  }
};
