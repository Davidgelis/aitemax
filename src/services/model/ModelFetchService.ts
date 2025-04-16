import { supabase } from '@/integrations/supabase/client';
import { AIModel } from '@/components/dashboard/types';

const mapDbModelsToAIModels = (dbModels: any[]): AIModel[] => {
  return dbModels.map(model => ({
    id: model.id,
    name: model.name,
    provider: model.provider,
    description: model.description || '',
    contextLength: model.context_length || 4000, // Default
    capabilities: model.capabilities || [],
    strengths: model.strengths || [],
    limitations: model.limitations || [],
    updated_at: model.updated_at,
    created_at: model.created_at,
    is_deleted: model.is_deleted
  }));
};

export class ModelFetchService {
  static async fetchModels(): Promise<AIModel[]> {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('is_deleted', false);

      if (error) {
        console.error('Error fetching models:', error);
        return [];
      }

      if (!data) {
        console.warn('No models found.');
        return [];
      }

      return mapDbModelsToAIModels(data);
    } catch (error) {
      console.error('Unexpected error fetching models:', error);
      return [];
    }
  }

  static async getProviders(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('provider')
        .eq('is_deleted', false);

      if (error) {
        console.error('Error fetching providers:', error);
        return [];
      }

      if (!data) {
        console.warn('No providers found.');
        return [];
      }

      const providers = [...new Set(data.map(item => item.provider))];
      return providers;
    } catch (error) {
      console.error('Unexpected error fetching providers:', error);
      return [];
    }
  }

  static async fetchModelById(id: string): Promise<AIModel> {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) {
        console.error(`Error fetching model with id ${id}:`, error);
        throw error;
      }

      if (!data) {
        console.warn(`Model with id ${id} not found.`);
        return null as any;
      }

      return {
        id: data.id,
        name: data.name,
        provider: data.provider,
        description: data.description || '',
        contextLength: data.context_length || 4000,
        capabilities: data.capabilities || [],
        strengths: data.strengths || [],
        limitations: data.limitations || [],
        updated_at: data.updated_at,
        created_at: data.created_at,
        is_deleted: data.is_deleted
      };
    } catch (error) {
      console.error(`Unexpected error fetching model with id ${id}:`, error);
      throw error;
    }
  }
}
