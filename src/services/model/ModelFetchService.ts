
import { supabase } from "@/integrations/supabase/client";
import { AIModel } from "@/components/dashboard/types";
import { triggerInitialModelUpdate } from "@/utils/triggerInitialModelUpdate";

// Export a constant for the GPT-4.1 ID to prevent mistyping
export const GPT41_ID = 'gpt-4.1';

export const ModelFetchService = {
  async fetchModels(): Promise<AIModel[]> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .is('is_deleted', null)  // Only fetch models that are not marked as deleted
        .order('provider')
        .order('name');
      
      if (error) {
        console.error('Error fetching models:', error);
        throw error;
      }
      
      // Ensure GPT-4.1 is always in the model list with the future-proof alias ID
      const hasGpt41 = data.some(model => model.id === GPT41_ID);
      if (!hasGpt41) {
        console.warn('GPT-4.1 model not found in database. Adding default entry with future-proof alias.');
        const defaultGpt41: AIModel = {
          id: GPT41_ID,
          name: 'GPT-4.1',
          provider: 'OpenAI',
          description: 'Advanced language model with improved reasoning capabilities',
          strengths: ['Enhanced context understanding', 'More nuanced responses'],
          limitations: ['Experimental model', 'Pricing may vary']
        };
        
        // Insert the default GPT-4.1 model if it doesn't exist
        const { data: insertedModel, error: insertError } = await supabase
          .from('ai_models')
          .insert(defaultGpt41)
          .select('*');
        
        if (insertError) {
          console.error('Error inserting GPT-4.1 model:', insertError);
        } else if (insertedModel && insertedModel.length > 0) {
          console.log('Added GPT-4.1 model to the database with ID:', GPT41_ID);
          data.push(insertedModel[0]);
        }
      }
      
      return data as AIModel[];
    } catch (error) {
      console.error('Exception in fetchModels:', error);
      throw error;
    }
  },
  
  async getModelById(id: string): Promise<AIModel | null> {
    try {
      console.log(`Fetching model with ID: ${id}`);
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', id)
        .is('is_deleted', null)  // Only get models that are not deleted
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching model by id:', error);
        return null;
      }
      
      return data as AIModel;
    } catch (error) {
      console.error('Exception in getModelById:', error);
      return null;
    }
  },
  
  async triggerModelUpdate(forceUpdate = true): Promise<boolean> {
    try {
      console.log(`Triggering AI model update. Force update: ${forceUpdate}`);
      const response = await supabase.functions.invoke('update-ai-models', {
        method: 'POST',
        headers: {
          'X-Force-Update': forceUpdate ? 'true' : 'false'
        }
      });
      
      if (response.error) {
        console.error('Error from edge function:', response.error);
        throw response.error;
      }
      
      console.log('Model update response:', response.data);
      return response.data.success;
    } catch (error) {
      console.error('Error triggering model update:', error);
      return false;
    }
  },
  
  async getProviders(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('provider')
        .is('is_deleted', null)  // Only include non-deleted models
        .order('provider');
      
      if (error) {
        console.error('Error fetching providers:', error);
        return [];
      }
      
      // Extract unique providers
      const providers = new Set(data.map(item => item.provider || 'Unknown').filter(Boolean));
      return Array.from(providers);
    } catch (error) {
      console.error('Exception in getProviders:', error);
      return [];
    }
  },
  
  async getModelCountByProvider(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('provider')
        .is('is_deleted', null);  // Only count non-deleted models
      
      if (error) {
        console.error('Error fetching model counts:', error);
        return {};
      }
      
      const counts: Record<string, number> = {};
      data.forEach(model => {
        const provider = model.provider || 'Unknown';
        counts[provider] = (counts[provider] || 0) + 1;
      });
      
      return counts;
    } catch (error) {
      console.error('Exception in getModelCountByProvider:', error);
      return {};
    }
  }
};
