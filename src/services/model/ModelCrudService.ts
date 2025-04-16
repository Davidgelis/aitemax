
import { supabase } from "@/integrations/supabase/client";
import { AIModel } from "@/components/dashboard/types";

export const ModelCrudService = {
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
      console.log(`ModelService: Starting deletion for model ID: ${id}`);
      
      // Mark the model as deleted in the database using a dedicated column
      // This ensures the edge function won't recreate it
      const { error: markError } = await supabase
        .from('ai_models')
        .update({ 
          updated_at: new Date().toISOString(),
          is_deleted: true 
        })
        .eq('id', id);
        
      if (markError) {
        console.error('Error marking model as deleted:', markError);
        return false;
      }
      
      // Now perform the actual deletion
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .match({ id });
      
      if (error) {
        console.error('Error deleting model:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        return false;
      }
      
      console.log(`ModelService: Successfully deleted model ${id}`);
      return true;
    } catch (error) {
      console.error('Exception in deleteModel:', error);
      return false;
    }
  }
};
