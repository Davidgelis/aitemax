
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ModelService } from '@/services/ModelService';
import { toast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AIModel } from './types';

export const ModelFetchTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchModelData = async () => {
    setIsLoading(true);
    try {
      // Get providers
      const providerList = await ModelService.getProviders();
      setProviders(providerList);
      
      // Get models
      const modelList = await ModelService.fetchModels();
      setModels(modelList);
      
      toast({
        title: "Model Data Fetched",
        description: `Found ${providerList.length} providers with ${modelList.length} models`,
      });
    } catch (error) {
      console.error('Error fetching model data:', error);
      toast({
        title: "Error Fetching Data",
        description: "Failed to load model information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerUpdate = async () => {
    setIsRefreshing(true);
    try {
      toast({
        title: "Updating Models",
        description: "Triggering model update from all providers...",
      });
      
      const success = await ModelService.triggerModelUpdate(true);
      
      if (success) {
        // Refresh model data after update
        await fetchModelData();
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update models. Check console for errors.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error triggering update:', error);
      toast({
        title: "Error",
        description: "An error occurred during the update process",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch models on component mount
  useEffect(() => {
    fetchModelData();
  }, []);

  // Group models by provider for the dropdown
  const modelsByProvider = React.useMemo(() => {
    const grouped: Record<string, AIModel[]> = {};
    
    providers.forEach(provider => {
      grouped[provider] = models.filter(model => model.provider === provider);
    });
    
    return grouped;
  }, [models, providers]);

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    const selectedModelData = models.find(model => model.id === modelId);
    if (selectedModelData) {
      toast({
        title: "Model Selected",
        description: `Selected ${selectedModelData.name} from ${selectedModelData.provider}`,
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-[#545454]">AI Model Selection</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="space-y-4">
            <Select value={selectedModel || ''} onValueChange={handleModelSelect}>
              <SelectTrigger className="w-full bg-[#fafafa] border-[#084b49] text-[#545454]">
                <SelectValue placeholder="Select an AI model" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {providers.length === 0 ? (
                  <div className="p-2 text-center text-[#545454]">No models found</div>
                ) : (
                  providers.map(provider => (
                    <SelectGroup key={provider}>
                      <SelectLabel className="text-[#545454]">{provider}</SelectLabel>
                      {modelsByProvider[provider] && modelsByProvider[provider].map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          <span className="text-[#545454]">{model.name}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                )}
              </SelectContent>
            </Select>
            
            <div className="flex justify-end">
              <Button 
                onClick={triggerUpdate}
                disabled={isRefreshing || isLoading} 
                className="bg-[#084b49] hover:bg-[#033332] text-white"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Models
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
