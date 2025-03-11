
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
  },

  async testApiConnection(): Promise<boolean> {
    try {
      console.log('Testing OpenAI API connection...');
      const response = await supabase.functions.invoke('test-api-connection', {
        method: 'POST'
      });
      
      if (response.error) {
        console.error('Error testing API connection:', response.error);
        toast({
          title: "API Connection Failed",
          description: `Error: ${response.error.message || "Unknown error"}`,
          variant: "destructive",
        });
        return false;
      }
      
      console.log('API connection test result:', response.data);
      
      if (response.data?.success) {
        toast({
          title: "API Connection Successful",
          description: `Connected to ${response.data.model || "OpenAI API"} (${response.data.tokenCount || 0} tokens used)`,
          variant: "default",
        });
        return true;
      } else {
        toast({
          title: "API Connection Failed",
          description: response.data?.message || "Unknown error",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error testing API connection:', error);
      toast({
        title: "API Connection Error",
        description: `Error: ${(error as Error).message || "Unknown error"}`,
        variant: "destructive",
      });
      return false;
    }
  }
};
