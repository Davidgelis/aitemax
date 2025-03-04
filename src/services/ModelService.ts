
import { supabase } from "@/integrations/supabase/client";
import { AIModel } from "@/components/dashboard/types";
import { toast } from "@/hooks/use-toast";
import { triggerInitialModelUpdate } from "@/utils/triggerInitialModelUpdate";

export const ModelService = {
  async fetchModels(): Promise<AIModel[]> {
    try {
      console.log('Fetching AI models from database...');
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
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
      toast({
        title: "Error Fetching Models",
        description: "Failed to load AI models. Please try again later.",
        variant: "destructive"
      });
      throw error;
    }
  },
  
  async getModelById(id: string): Promise<AIModel | null> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', id)
        .single();
      
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
      const result = await triggerInitialModelUpdate(forceUpdate);
      return result.success;
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
        .select('provider');
      
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
  },
  
  // New methods for the master panel
  async addModel(model: Partial<AIModel>): Promise<AIModel | null> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .insert({
          name: model.name,
          provider: model.provider,
          description: model.description,
          strengths: model.strengths,
          limitations: model.limitations
        })
        .select();
      
      if (error) {
        console.error('Error adding model:', error);
        return null;
      }
      
      return data[0] as AIModel;
    } catch (error) {
      console.error('Exception in addModel:', error);
      return null;
    }
  },
  
  async updateModel(id: string, model: Partial<AIModel>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_models')
        .update({
          name: model.name,
          provider: model.provider,
          description: model.description,
          strengths: model.strengths,
          limitations: model.limitations
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating model:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception in updateModel:', error);
      return false;
    }
  },
  
  async deleteModel(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting model:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception in deleteModel:', error);
      return false;
    }
  }
};
