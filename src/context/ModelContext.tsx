
import React, { createContext, useContext, useState, useEffect } from "react";
import { AIModel } from "@/components/dashboard/types";
import { ModelService } from "@/services/ModelService";
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
}

const ModelContext = createContext<ModelContextType>({
  models: [],
  isLoading: false,
  error: null,
  refreshModels: async () => {},
  selectedModel: null,
  setSelectedModel: () => {},
  addModel: async () => null,
  updateModel: async () => false,
  deleteModel: async () => false,
});

export const useModels = () => useContext(ModelContext);

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
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
    toast({
      title: "Refreshing Models",
      description: "Loading the latest AI models data...",
    });
    
    try {
      // Try to force refresh models from the edge function first
      const refreshSuccess = await ModelService.triggerModelUpdate(true);
      
      if (!refreshSuccess) {
        console.log('Model update through edge function failed, falling back to direct database fetch');
      }
      
      // Fetch models from database
      await fetchModels();
      
      toast({
        title: "Models Refreshed",
        description: `${models.length} AI models loaded.`,
      });
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
      console.log(`ModelContext: Initiating model deletion for ID: ${id}`);
      
      // Direct approach - call the service to delete from the database
      let success = false;
      
      try {
        // Attempt to delete directly using the service
        success = await ModelService.deleteModel(id);
        
        if (!success) {
          console.log(`ModelContext: Model ${id} deletion failed from service`);
          return false;
        }
      } catch (error) {
        console.error('Error from ModelService.deleteModel:', error);
        throw error; // Re-throw to handle in the outer catch
      }
      
      console.log(`ModelContext: Model ${id} deleted successfully from database`);
      
      // Only update local state if confirmed the deletion happened in database
      if (success) {
        // Update models list by filtering out the deleted model
        setModels(prev => prev.filter(m => m.id !== id));
        
        // If the deleted model is the currently selected model, reset it
        if (selectedModel && selectedModel.id === id) {
          setSelectedModel(null);
        }
        
        return true;
      }
      
      return false;
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
        deleteModel
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};
