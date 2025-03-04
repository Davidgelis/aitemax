
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ModelService } from '@/services/ModelService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Laptop } from 'lucide-react';
import { AIModel } from './types';

interface ModelSelectorProps {
  onSelect: (model: AIModel | null) => void;
  isInitializingModels?: boolean;
  selectedModel: AIModel | null;
}

export const ModelSelector = ({ onSelect, isInitializingModels = false, selectedModel }: ModelSelectorProps) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
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

  const handleSelectModel = (model: AIModel) => {
    onSelect(model);
    setOpen(false);
  };

  const isLoading = loading || isInitializingModels;

  return (
    <div className="w-[300px] mr-auto">
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div>
          <Button 
            onClick={() => setOpen(true)}
            className="w-full h-10 bg-[#fafafa] border border-[#084b49] text-[#545454] hover:bg-[#f0f0f0] flex justify-between items-center"
            variant="outline"
          >
            <span className="truncate">
              {selectedModel ? selectedModel.name : "Select AI model"}
            </span>
            <Laptop className="ml-2 h-4 w-4 text-[#084b49]" />
          </Button>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent 
              className="p-0 max-w-md max-h-[70vh] w-full overflow-hidden bg-white border border-[#084b49]"
              overlayClassName="backdrop-blur-sm bg-black/30"
            >
              <ScrollArea className="h-[65vh] w-full p-4">
                <div className="space-y-6">
                  {providers.length === 0 ? (
                    <div className="p-4 text-center text-[#545454]">No models found</div>
                  ) : (
                    providers.map(provider => (
                      <div key={provider} className="space-y-2">
                        <h3 className="text-[#545454] font-semibold text-lg">{provider}</h3>
                        <div className="space-y-2">
                          {modelsByProvider[provider] && modelsByProvider[provider].map(model => (
                            <div 
                              key={model.id}
                              onClick={() => handleSelectModel(model)}
                              className={`p-3 rounded-md cursor-pointer transition-colors ${
                                selectedModel?.id === model.id 
                                  ? 'bg-[#084b49] text-white' 
                                  : 'bg-[#fafafa] text-[#545454] hover:bg-[#f0f0f0]'
                              }`}
                            >
                              <div className="font-medium">{model.name}</div>
                              {model.description && (
                                <div className="text-sm mt-1 opacity-90 line-clamp-2">
                                  {model.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          
          {selectedModel && (
            <div className="mt-4 p-4 bg-background border border-[#084b49] rounded-md">
              <div className="space-y-3">
                <h3 className="font-medium text-lg text-[#545454]">{selectedModel.name}</h3>
                {selectedModel.provider && <p className="text-sm text-[#545454]">Provider: {selectedModel.provider}</p>}
                {selectedModel.description && <p className="text-sm text-[#545454]">{selectedModel.description}</p>}
                
                {selectedModel.strengths && selectedModel.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mt-3 mb-1 text-[#545454]">Strengths:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-[#545454]">
                      {selectedModel.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedModel.limitations && selectedModel.limitations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mt-3 mb-1 text-[#545454]">Limitations:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-[#545454]">
                      {selectedModel.limitations.map((limitation, i) => (
                        <li key={i}>{limitation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
