
import { ModelFetchService } from './ModelFetchService';
import { ModelCrudService } from './ModelCrudService';
import { ModelEnhancementService } from './ModelEnhancementService';
import { AIModel } from '@/components/dashboard/types';
import { Question, Variable } from '@/components/dashboard/types';

// Create a unified ModelService that combines all the individual services
export const ModelService = {
  // ModelFetchService methods
  fetchModels: ModelFetchService.fetchModels,
  getModelById: ModelFetchService.getModelById,
  triggerModelUpdate: ModelFetchService.triggerModelUpdate,
  getProviders: ModelFetchService.getProviders,
  getModelCountByProvider: ModelFetchService.getModelCountByProvider,
  
  // ModelCrudService methods
  addModel: ModelCrudService.addModel,
  updateModel: ModelCrudService.updateModel,
  deleteModel: ModelCrudService.deleteModel,
  
  // ModelEnhancementService methods
  enhanceModelsWithAI: ModelEnhancementService.enhanceModelsWithAI,
  
  // Prompt analysis methods
  analyzePrompt: async (
    promptText: string, 
    userId: string | undefined, 
    images: any[] | null, 
    websiteContext: { url: string; instructions: string } | null, 
    smartContext: { context: string; usageInstructions: string } | null,
    currentPromptId: string | null
  ) => {
    try {
      // Call the edge function to analyze the prompt
      const { data, error } = await fetch('/api/analyze-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptText,
          userId,
          images,
          websiteContext,
          smartContext,
          currentPromptId
        }),
      }).then(res => res.json());
      
      if (error) {
        console.error('Error analyzing prompt:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Exception in analyzePrompt:', err);
      return null;
    }
  },
  
  // Prompt enhancement method
  enhancePrompt: async (
    prompt: string,
    primary: string | null,
    secondary: string | null,
    answeredQuestions: Question[],
    relevantVariables: Variable[],
    template: any
  ) => {
    try {
      // Call the edge function to enhance the prompt
      const { data, error } = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          primary,
          secondary,
          answeredQuestions,
          relevantVariables,
          template
        }),
      }).then(res => res.json());
      
      if (error) {
        console.error('Error enhancing prompt:', error);
        return null;
      }
      
      return data?.enhancedPrompt || null;
    } catch (err) {
      console.error('Exception in enhancePrompt:', err);
      return null;
    }
  }
};
