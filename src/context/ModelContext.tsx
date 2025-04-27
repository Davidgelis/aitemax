import React, { createContext, useContext, useState, useEffect } from "react";
import { AIModel } from "@/components/dashboard/types";
import { ModelService } from "@/services/model";
import { useToast } from "@/hooks/use-toast";

interface ModelContextType {
  models: AIModel[];
  isLoading: boolean;
  error: string | null;
  refreshModels: () => Promise<void>;
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel | null) => void;
  addModel: (model: Partial<AIModel>) => Promise<AIModel | null>;
  updateModel: (id: string, model: Partial<AIModel>) => Promise<boolean>;
  deleteModel: (id: string) => Promise<boolean>;
  enhanceModelsWithAI: () => Promise<boolean>;
}

const ModelContext = createContext<ModelContextType>({
  models: [],
  isLoading: false,
  error: null,
  refreshModels: async () => {},
  selectedModel: {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Advanced language model for comprehensive analysis',
    strengths: ['Detailed analysis', 'Multi-step reasoning', 'Large context window'],
    limitations: ['Higher cost', 'Advanced capabilities']
  },
  setSelectedModel: () => {},
  addModel: async () => null,
  updateModel: async () => false,
  deleteModel: async () => false,
  enhanceModelsWithAI: async () => false,
});

export const useModels = () => useContext(ModelContext);

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>({
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Advanced language model for comprehensive analysis',
    strengths: ['Detailed analysis', 'Multi-step reasoning', 'Large context window'],
    limitations: ['Higher cost', 'Advanced capabilities']
  });
  const { toast } = useToast();

  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedModels = await ModelService.fetchModels();
      setModels(fetchedModels);
      console.log(`Loaded ${fetchedModels.length} models successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching models';
      setError(errorMessage);
      console.error('Error loading models:', err);
      
      toast({
        title: "Error Loading Models",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshModels = async () => {
    console.log('Refreshing models...');
    
    try {
      // Try to force refresh models from the edge function first
      const refreshSuccess = await ModelService.triggerModelUpdate(true);
      
      if (!refreshSuccess) {
        console.log('Model update through edge function failed, falling back to direct database fetch');
      }
      
      // Fetch models from database
      await fetchModels();
    } catch (err) {
      console.error('Error during model refresh:', err);
      toast({
        title: "Error Refreshing Models",
        description: "Failed to refresh models. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addModel = async (model: Partial<AIModel>): Promise<AIModel | null> => {
    try {
      const newModel = await ModelService.addModel(model);
      if (newModel) {
        setModels(prev => [...prev, newModel]);
        toast({
          title: "Success",
          description: "AI model added successfully",
        });
        return newModel;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error adding model';
      console.error('Error adding model:', err);
      
      toast({
        title: "Error Adding Model",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateModel = async (id: string, model: Partial<AIModel>): Promise<boolean> => {
    try {
      const success = await ModelService.updateModel(id, model);
      if (success) {
        setModels(prev => prev.map(m => m.id === id ? { ...m, ...model } : m));
        
        // If the updated model is the currently selected model, update it
        if (selectedModel && selectedModel.id === id) {
          setSelectedModel({ ...selectedModel, ...model });
        }
        
        toast({
          title: "Success",
          description: "AI model updated successfully",
        });
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error updating model';
      console.error('Error updating model:', err);
      
      toast({
        title: "Error Updating Model",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteModel = async (id: string): Promise<boolean> => {
    try {
      console.log(`ModelContext: Attempting to delete model with ID: ${id}`);
      
      // First find the model to get its name for the toast
      const modelToDelete = models.find(m => m.id === id);
      const modelName = modelToDelete?.name || 'Unknown model';
      
      // DIRECT APPROACH - Call the service to delete the model
      const success = await ModelService.deleteModel(id);
      
      if (!success) {
        console.log(`ModelContext: Model deletion failed`);
        toast({
          title: "Error Deleting Model",
          description: "Failed to delete the model from the database. Please try again.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log(`ModelContext: Model ${id} deleted successfully`);
      
      // Update the local state immediately
      setModels(prev => prev.filter(m => m.id !== id));
      
      // If the deleted model is the currently selected model, reset it
      if (selectedModel && selectedModel.id === id) {
        setSelectedModel(null);
      }
      
      // Force a refresh to ensure UI and database are in sync
      await fetchModels();
      
      toast({
        title: "Model Deleted",
        description: `The model "${modelName}" has been successfully deleted.`,
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error deleting model';
      console.error('Exception in ModelContext.deleteModel:', err);
      
      toast({
        title: "Error Deleting Model",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  };

  const enhanceModelsWithAI = async (): Promise<boolean> => {
    try {
      const success = await ModelService.enhanceModelsWithAI();
      
      if (success) {
        // Refresh models to get the updated information
        await fetchModels();
        return true;
      }
      
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error enhancing models with AI';
      console.error('Error enhancing models with AI:', err);
      
      toast({
        title: "Error Enhancing Models with AI",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <ModelContext.Provider 
      value={{ 
        models, 
        isLoading, 
        error, 
        refreshModels,
        selectedModel,
        setSelectedModel,
        addModel,
        updateModel,
        deleteModel,
        enhanceModelsWithAI
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};
