
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
}

const ModelContext = createContext<ModelContextType>({
  models: [],
  isLoading: false,
  error: null,
  refreshModels: async () => {},
  selectedModel: null,
  setSelectedModel: () => {},
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
    
    await fetchModels();
    
    toast({
      title: "Models Refreshed",
      description: `${models.length} AI models loaded.`,
    });
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
        setSelectedModel
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};
