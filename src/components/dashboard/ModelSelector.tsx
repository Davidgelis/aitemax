
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ModelService } from '@/services/ModelService';
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

interface ModelSelectorProps {
  onSelect: (model: AIModel | null) => void;
  isInitializingModels?: boolean;
}

export const ModelSelector = ({ onSelect, isInitializingModels = false }: ModelSelectorProps) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [providers, setProviders] = useState<string[]>([]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      // Fetch models using ModelService
      const modelList = await ModelService.fetchModels();
      setModels(modelList);
      
      // Get unique providers
      const providerList = await ModelService.getProviders();
      setProviders(providerList);
      
      setLastUpdate(new Date());
      console.log(`Fetched ${modelList.length} models from ${providerList.length} providers`);
      
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

  // Memoize models grouped by provider to avoid recalculations
  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, AIModel[]> = {};
    
    providers.forEach(provider => {
      grouped[provider] = models.filter(model => model.provider === provider);
    });
    
    return grouped;
  }, [models, providers]);

  useEffect(() => {
    fetchModels();
    
    // Set up a polling interval to check for new models every 24 hours
    const intervalId = setInterval(() => {
      console.log('Checking for model updates (daily polling)');
      fetchModels();
    }, 86400000); // 24 hours in milliseconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Refetch models when initialization status changes
  useEffect(() => {
    if (!isInitializingModels && loading) {
      fetchModels();
    }
  }, [isInitializingModels]);

  const handleSelectModel = (id: string) => {
    const model = models.find(m => m.id === id);
    setSelectedId(id);
    onSelect(model || null);
  };

  // Format date for display 
  const formatUpdateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isLoading = loading || isInitializingModels;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-[#545454]">AI Model Selection</h3>
        {lastUpdate && (
          <div className="text-xs text-[#545454]">
            Last updated: {formatUpdateTime(lastUpdate)}
          </div>
        )}
      </div>
      
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="space-y-4">
          <Select value={selectedId || ''} onValueChange={handleSelectModel}>
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
          
          {selectedId && (
            <div className="mt-4 p-4 bg-background border border-[#084b49] rounded-md">
              {models.filter(m => m.id === selectedId).map(model => (
                <div key={model.id} className="space-y-3">
                  <h3 className="font-medium text-lg text-[#545454]">{model.name}</h3>
                  {model.provider && <p className="text-sm text-[#545454]">Provider: {model.provider}</p>}
                  {model.description && <p className="text-sm text-[#545454]">{model.description}</p>}
                  
                  {model.strengths && model.strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mt-3 mb-1 text-[#545454]">Strengths:</h4>
                      <ul className="list-disc list-inside text-sm space-y-1 text-[#545454]">
                        {model.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {model.limitations && model.limitations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mt-3 mb-1 text-[#545454]">Limitations:</h4>
                      <ul className="list-disc list-inside text-sm space-y-1 text-[#545454]">
                        {model.limitations.map((limitation, i) => (
                          <li key={i}>{limitation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

