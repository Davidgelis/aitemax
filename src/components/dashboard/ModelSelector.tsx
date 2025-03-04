
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
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

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  limitations: string[];
}

interface ModelSelectorProps {
  onSelect: (model: AIModel | null) => void;
}

export const ModelSelector = ({ onSelect }: ModelSelectorProps) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<AIModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('ai_models')
          .select('*')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        setModels(data || []);
        setFilteredModels(data || []);
      } catch (error) {
        console.error('Error fetching AI models:', error);
      } finally {
        setLoading(false);
      }
    };

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
    <div className="w-full space-y-2">
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
