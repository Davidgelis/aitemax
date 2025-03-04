
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ModelService } from '@/services/ModelService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Laptop, Search, X, Check } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;
    const query = searchQuery.toLowerCase();
    return models.filter(model => 
      model.name.toLowerCase().includes(query) || 
      (model.description && model.description.toLowerCase().includes(query)) ||
      model.provider.toLowerCase().includes(query)
    );
  }, [models, searchQuery]);

  // Get all models flattened (not grouped by provider), for the centered display
  const allModels = useMemo(() => {
    return [...filteredModels].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredModels]);

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
              className="p-0 max-w-md max-h-[80vh] w-full overflow-hidden bg-white border border-[#084b49] rounded-lg shadow-xl"
              overlayClassName="backdrop-blur-sm bg-black/50"
            >
              <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search models..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-[#F1F1F1] text-[#545454] focus:outline-none focus:ring-1 focus:ring-[#084b49]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700" 
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <ScrollArea className="h-[calc(80vh-4rem)] w-full">
                <div className="p-6">
                  {allModels.length === 0 ? (
                    <div className="py-10 text-center text-[#545454]">
                      {searchQuery ? "No models found matching your search" : "No models available"}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      {allModels.map(model => (
                        <button
                          key={model.id}
                          onClick={() => handleSelectModel(model)}
                          className="w-full text-center py-3 px-4 transition-all outline-none"
                        >
                          <div className={`text-xl ${
                            selectedModel?.id === model.id 
                              ? 'text-[#33fea6] font-medium' 
                              : 'text-[#545454]/60 hover:text-[#545454]'
                          }`}>
                            {model.name}
                          </div>
                        </button>
                      ))}
                    </div>
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
