
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
import { Button } from '@/components/ui/button';
import { AIModel } from './types';

interface ModelSelectorProps {
  onSelect: (model: AIModel | null) => void;
}

export const ModelSelector = ({ onSelect }: ModelSelectorProps) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<AIModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

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
      
      setModels(data || []);
      setFilteredModels(data || []);
    } catch (error) {
      console.error('Error fetching AI models:', error);
      toast({
        title: "Error fetching models",
        description: "Could not load AI models. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAiModels = async () => {
    try {
      setLoadingUpdate(true);
      console.log('Invoking update-ai-models Edge Function...');
      
      // Call the Supabase Edge Function directly
      const { data, error } = await supabase.functions.invoke('update-ai-models', {
        method: 'POST',
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to update AI models');
      }
      
      console.log('Edge function response:', data);
      
      toast({
        title: "Success",
        description: "AI models updated successfully.",
      });
      
      // Refetch the models after update
      fetchModels();
    } catch (error) {
      console.error('Error updating AI models:', error);
      toast({
        title: "Error",
        description: "Failed to update AI models. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingUpdate(false);
    }
  };

  useEffect(() => {
    fetchModels();
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

  if (loading) {
    return (
      <div className="w-full max-w-md space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-700">AI Model Selection</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={updateAiModels} 
          disabled={loadingUpdate}
          className="text-sm"
        >
          {loadingUpdate ? 'Updating...' : 'Update Models'}
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search AI models..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-9 h-10"
          />
        </div>
        
        <Select value={selectedId || ''} onValueChange={handleSelectModel}>
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="Select an AI model" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>AI Models</SelectLabel>
              {filteredModels.length === 0 ? (
                <div className="p-2 text-center text-gray-500">No models found</div>
              ) : (
                filteredModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center">
                      <span>{model.name}</span>
                      {model.provider && (
                        <span className="ml-2 text-xs text-gray-500">({model.provider})</span>
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
        <div className="mt-4 p-4 bg-background border rounded-md">
          {models.filter(m => m.id === selectedId).map(model => (
            <div key={model.id} className="space-y-3">
              <h3 className="font-medium text-lg">{model.name}</h3>
              {model.provider && <p className="text-sm text-gray-500">Provider: {model.provider}</p>}
              {model.description && <p className="text-sm">{model.description}</p>}
              
              {model.strengths && model.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mt-3 mb-1">Strengths:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {model.strengths.map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {model.limitations && model.limitations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mt-3 mb-1">Limitations:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
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
