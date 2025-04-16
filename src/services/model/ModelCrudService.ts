
import { AIModel } from '@/components/dashboard/types';
import { supabase } from '@/integrations/supabase/client';

export class ModelCrudService {
  /**
   * Create a new AI model
   * @param model The model to create
   * @returns The created model
   */
  async createModel(model: Omit<AIModel, 'id'>): Promise<AIModel> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .insert({
          name: model.name,
          provider: model.provider,
          description: model.description,
          strengths: model.strengths,
          limitations: model.limitations,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as AIModel;
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }

  /**
   * Get an AI model by ID
   * @param id The ID of the model to get
   * @returns The model
   */
  async getModelById(id: string): Promise<AIModel> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Model not found');
      
      return data as AIModel;
    } catch (error) {
      console.error('Error getting model:', error);
      throw error;
    }
  }

  /**
   * Update an AI model
   * @param id The ID of the model to update
   * @param model The updated model data
   * @returns The updated model
   */
  async updateModel(id: string, model: Partial<AIModel>): Promise<AIModel> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .update({
          name: model.name,
          provider: model.provider,
          description: model.description,
          strengths: model.strengths,
          limitations: model.limitations,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Model not found');
      
      return data as AIModel;
    } catch (error) {
      console.error('Error updating model:', error);
      throw error;
    }
  }

  /**
   * Delete an AI model
   * @param id The ID of the model to delete
   */
  async deleteModel(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }

  /**
   * Soft delete an AI model 
   * @param id The ID of the model to soft delete
   */
  async softDeleteModel(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_models')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw new Error(error.message);
    } catch (error) {
      console.error('Error soft deleting model:', error);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted AI model
   * @param id The ID of the model to restore
   */
  async restoreModel(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_models')
        .update({ is_deleted: false })
        .eq('id', id);

      if (error) throw new Error(error.message);
    } catch (error) {
      console.error('Error restoring model:', error);
      throw error;
    }
  }
}
