
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
  
  async addModel(model: Partial<AIModel>): Promise<AIModel | null> {
    try {
      console.log('Adding new model:', model);
      const { data, error } = await supabase
        .from('ai_models')
        .insert({
          name: model.name,
          provider: model.provider
        })
        .select();
      
      if (error) {
        console.error('Error adding model:', error);
        throw error;
      }
      
      console.log('Model added successfully:', data[0]);
      return data[0] as AIModel;
    } catch (error) {
      console.error('Exception in addModel:', error);
      throw error;
    }
  },
  
  async updateModel(id: string, model: Partial<AIModel>): Promise<boolean> {
    try {
      console.log(`Updating model with ID ${id}:`, model);
      const { error } = await supabase
        .from('ai_models')
        .update({
          name: model.name,
          provider: model.provider
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating model:', error);
        throw error;
      }
      
      console.log(`Model ${id} updated successfully`);
      return true;
    } catch (error) {
      console.error('Exception in updateModel:', error);
      throw error;
    }
  },
  
  async deleteModel(id: string): Promise<boolean> {
    try {
      console.log(`Attempting to delete model with ID: ${id}`);
      
      // First verify if the model exists
      const model = await this.getModelById(id);
      if (!model) {
        console.error(`Model with ID ${id} not found, cannot delete`);
        throw new Error("Model not found");
      }
      
      // Perform the delete operation
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting model from Supabase:', error);
        throw error;
      }
      
      // Verify the deletion was successful by checking if the model still exists
      const checkDelete = await this.getModelById(id);
      if (checkDelete) {
        console.error(`Model with ID ${id} still exists after delete operation`);
        throw new Error("Failed to delete model");
      }
      
      console.log(`Successfully deleted model with ID: ${id} from database`);
      return true;
    } catch (error) {
      console.error('Exception in deleteModel:', error);
      toast({
        title: "Error Deleting Model",
        description: "Failed to delete AI model from the database. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }
};
