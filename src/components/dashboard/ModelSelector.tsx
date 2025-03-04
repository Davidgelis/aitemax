
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AIModel } from './types';

interface ModelSelectorProps {
  onSelect: (model: AIModel | null) => void;
}

export const ModelSelector = ({ onSelect }: ModelSelectorProps) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<AIModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchModels = async () => {
    try {
      setLoading(true);
      console.log('Fetching AI models from Supabase...');
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      console.log('Fetched AI models:', data);
      
      if (data && data.length > 0) {
        setModels(data);
        setFilteredModels(data);
        setLastUpdate(new Date());
      } else {
        console.log('No models found, attempting to trigger update');
        await triggerModelUpdate();
      }
    } catch (error) {
      console.error('Error fetching AI models:', error);
      toast({
        title: "Error fetching models",
        description: "Could not load AI models. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerModelUpdate = async () => {
    try {
      setIsUpdating(true);
      console.log('Invoking update-ai-models Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('update-ai-models', {
        method: 'POST',
        headers: {
          'X-Force-Update': 'true'
        }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to update AI models');
      }
      
      console.log('Edge function response:', data);
      
      toast({
        title: "Models updated",
        description: "AI models have been refreshed.",
      });
      
      // Re-fetch the models after update
      await fetchModels();
      
    } catch (error) {
      console.error('Error updating models:', error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update AI models",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchModels();
    
    // Set up a polling interval to check for new models every hour
    const intervalId = setInterval(() => {
      console.log('Checking for model updates (hourly polling)');
      fetchModels();
    }, 3600000); // 1 hour in milliseconds
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredModels(models);
    } else {
      const filtered = models.filter(model => 
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.provider?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredModels(filtered);
    }
  }, [searchTerm, models]);

  const handleSelectModel = (id: string) => {
    const model = models.find(m => m.id === id);
    setSelectedId(id);
    onSelect(model || null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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

  if (loading) {
    return (
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-[#545454]">AI Model Selection</h3>
          <div className="text-xs text-[#545454]">Loading models...</div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-[#545454]">AI Model Selection</h3>
        <div className="text-xs text-[#545454]">
          {isUpdating ? (
            "Updating models..."
          ) : (
            lastUpdate ? 
              `Last updated: ${formatUpdateTime(lastUpdate)}` : 
              'Models update daily'
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#545454]" />
          <Input
            placeholder="Search AI models..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-9 h-10 border-[#545454] text-[#545454]"
          />
        </div>
        
        <Select value={selectedId || ''} onValueChange={handleSelectModel}>
          <SelectTrigger className="w-full h-10 border-[#545454] text-[#545454]">
            <SelectValue placeholder="Select an AI model" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectGroup>
              <SelectLabel className="text-[#545454]">AI Models</SelectLabel>
              {filteredModels.length === 0 ? (
                <div className="p-2 text-center text-[#545454]">No models found</div>
              ) : (
                filteredModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center">
                      <span className="text-[#545454]">{model.name}</span>
                      {model.provider && (
                        <span className="ml-2 text-xs text-[#545454]">({model.provider})</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
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
  );
};
