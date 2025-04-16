
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
      
      // Check if we have models
      if (!data || data.length === 0) {
        console.log('No models found in database, attempting to trigger initial update...');
        await this.triggerModelUpdate();
        
        // Try fetching again after update
        const retryResult = await supabase
          .from('ai_models')
          .select('*')
          .is('is_deleted', null)  // Also filter here
          .order('provider')
          .order('name');
          
        if (retryResult.error) {
          console.error('Error in retry fetch:', retryResult.error);
          return [];
        }
        
        console.log(`Fetched ${retryResult.data?.length || 0} models after update`);
        return retryResult.data as AIModel[] || [];
      }
      
      console.log(`Fetched ${data.length} models from database`);
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
