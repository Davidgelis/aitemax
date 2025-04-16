
import { AIModel } from '@/components/dashboard/types';
import { supabase } from '@/integrations/supabase/client';

export class ModelFetchService {
  /**
   * Get all AI models
   * @returns Array of AI models
   */
  async getAllModels(): Promise<AIModel[]> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return data as AIModel[];
    } catch (error) {
      console.error('Error fetching all models:', error);
      throw error;
    }
  }

  /**
   * Get AI models by provider
   * @param provider The provider name
   * @returns Models from the specified provider
   */
  async getModelsByProvider(provider: string): Promise<AIModel[]> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('provider', provider)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return data as AIModel[];
    } catch (error) {
      console.error(`Error fetching models by provider ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Search AI models by name
   * @param query The search query
   * @returns Models matching the search criteria
   */
  async searchModelsByName(query: string): Promise<AIModel[]> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .ilike('name', `%${query}%`)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return data as AIModel[];
    } catch (error) {
      console.error(`Error searching models by name "${query}":`, error);
      throw error;
    }
  }

  /**
   * Get deleted AI models
   * @returns Soft-deleted models
   */
  async getDeletedModels(): Promise<AIModel[]> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_deleted', true)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return data as AIModel[];
    } catch (error) {
      console.error('Error fetching deleted models:', error);
      throw error;
    }
  }
}
