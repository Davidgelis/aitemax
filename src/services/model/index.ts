
import { ModelFetchService } from './ModelFetchService';
import { ModelCrudService } from './ModelCrudService';
import { ModelEnhancementService } from './ModelEnhancementService';
import { AIModel } from '@/components/dashboard/types';

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
  enhanceModelsWithAI: ModelEnhancementService.enhanceModelsWithAI
};
