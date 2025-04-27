import { supabase } from "@/integrations/supabase/client";
import { AIModel } from "@/components/dashboard/types";
import { triggerInitialModelUpdate } from "@/utils/triggerInitialModelUpdate";

export const ModelFetchService = {
  async fetchModels(): Promise<AIModel[]> {
    try {
      console.log('Fetching AI models from database...');
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
      
      // Ensure GPT-4.1 is always in the model list
      const hasGpt41 = data.some(model => model.name === "GPT-4.1");
      if (!hasGpt41) {
        console.warn('GPT-4.1 model not found in database. Adding default entry.');
        const defaultGpt41: AIModel = {
          id: 'gpt-4.1',
          name: 'GPT-4.1',
          provider: 'OpenAI',
          description: 'Advanced language model with improved reasoning capabilities',
          strengths: ['Enhanced context understanding', 'More nuanced responses'],
          limitations: ['Experimental model', 'Pricing may vary'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: null
        };
        
        // Insert the default GPT-4.1 model if it doesn't exist
        const { data: insertedModel, error: insertError } = await supabase
          .from('ai_models')
          .insert(defaultGpt41)
          .select();
        
        if (insertError) {
          console.error('Error inserting GPT-4.1 model:', insertError);
        } else {
          console.log('Added GPT-4.1 model to the database');
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
