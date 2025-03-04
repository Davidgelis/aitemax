
import { useState, useEffect, useMemo } from 'react';
import { ModelService } from '@/services/ModelService';
import { useToast } from '@/hooks/use-toast';
import { AIModel } from '../types';

export const useModelSelector = (selectedModel: AIModel | null, onSelect: (model: AIModel | null) => void, isInitializingModels = false) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const { toast } = useToast();
  const [providers, setProviders] = useState<string[]>([]);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => a.name.localeCompare(b.name));
  }, [models]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const modelList = await ModelService.fetchModels();
      setModels(modelList);
      
      const providerList = await ModelService.getProviders();
      setProviders(providerList);
      
      // Get latest update timestamp
      if (modelList.length > 0) {
        const updatedDates = modelList
          .map(model => model.updated_at ? new Date(model.updated_at) : null)
          .filter(date => date !== null) as Date[];
          
        if (updatedDates.length > 0) {
          const latestUpdate = new Date(Math.max(...updatedDates.map(date => date.getTime())));
          setLastUpdate(latestUpdate);
        }
      }
      
      console.log(`Fetched ${modelList.length} models from ${providerList.length} providers`);
      
      if (selectedModel) {
        const index = modelList.findIndex(model => model.id === selectedModel.id);
        if (index !== -1) {
          setActiveIndex(index);
        }
      }
      
      toast({
        title: "AI Models Loaded",
        description: `${modelList.length} AI models from ${providerList.length} providers have been loaded.`,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching AI models:', error);
      toast({
        title: "Error fetching models",
        description: "Could not load AI models.",
        variant: "destructive"
      });
      setLoading(false);
      setModels([]);
      setProviders([]);
    }
  };

  const handleDialogOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    setIsTransitioning(false);
    setScrollDirection(null);
    setIsAnimating(false);
    
    if (isOpen) {
      if (selectedModel) {
        const index = sortedModels.findIndex(model => model.id === selectedModel.id);
        if (index !== -1) {
          setActiveIndex(index);
        }
      }
    }
  };

  useEffect(() => {
    fetchModels();
    
    const intervalId = setInterval(() => {
      console.log('Checking for model updates (daily polling)');
      fetchModels();
    }, 86400000); // 24 hours
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isInitializingModels && loading) {
      fetchModels();
    }
  }, [isInitializingModels]);

  return {
    models,
    sortedModels,
    loading,
    open,
    setOpen,
    activeIndex,
    setActiveIndex,
    scrollDirection,
    setScrollDirection,
    isTransitioning,
    setIsTransitioning,
    isAnimating,
    setIsAnimating,
    handleDialogOpen,
    lastUpdate,
    isLoading: loading || isInitializingModels
  };
};
