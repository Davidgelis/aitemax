import { supabase } from '@/integrations/supabase/client';
import { AIModel } from '@/components/dashboard/types';

const transformDatabaseModelToAIModel = (dbModel: any): AIModel => {
  return {
    id: dbModel.id,
    name: dbModel.name,
    provider: dbModel.provider,
    description: dbModel.description || '',
    contextLength: dbModel.context_length || 4000, // Set default values for required properties
    capabilities: dbModel.capabilities || [],
    strengths: dbModel.strengths || [],
    limitations: dbModel.limitations || [],
    updated_at: dbModel.updated_at,
    created_at: dbModel.created_at,
    is_deleted: dbModel.is_deleted
  };
};

export const ModelCrudService = {
  async createModel(model: Omit<AIModel, 'id'>): Promise<AIModel | null> {
    try {
      const { data, error } = await supabase
        .from('models')
        .insert([
          {
            name: model.name,
            provider: model.provider,
            description: model.description,
            context_length: model.contextLength,
            capabilities: model.capabilities,
            pricing: model.pricing,
            strengths: model.strengths,
            limitations: model.limitations,
            is_recommended: model.isRecommended,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating model:', error);
        return null;
      }

      return transformDatabaseModelToAIModel(data);
    } catch (error) {
      console.error('Unexpected error creating model:', error);
      return null;
    }
  },

  async updateModel(id: string, updates: Partial<AIModel>): Promise<AIModel | null> {
    try {
      const { data, error } = await supabase
        .from('models')
        .update({
          name: updates.name,
          provider: updates.provider,
          description: updates.description,
          context_length: updates.contextLength,
          capabilities: updates.capabilities,
          pricing: updates.pricing,
          strengths: updates.strengths,
          limitations: updates.limitations,
          is_recommended: updates.isRecommended,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating model:', error);
        return null;
      }

      if (!data) {
        console.log(`Model with ID ${id} not found.`);
        return null;
      }

      return transformDatabaseModelToAIModel(data);
    } catch (error) {
      console.error('Unexpected error updating model:', error);
      return null;
    }
  },

  async deleteModel(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('models')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting model:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting model:', error);
      return false;
    }
  },
};
