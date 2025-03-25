
import { useEffect, useState } from 'react';
import { Check } from "lucide-react";
import { AIModel } from '../types';
import { DisplayModel } from './types';

interface ModelSelectorProps {
  onSelect: (model: AIModel | null) => void;
  selectedModel: AIModel | null;
  isInitializingModels?: boolean;
}

export const ModelSelector = ({ 
  onSelect, 
  selectedModel,
  isInitializingModels = false
}: ModelSelectorProps) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [displayModels, setDisplayModels] = useState<DisplayModel[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch models when component mounts
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would fetch models from an API
        // For now, we'll use a dummy data set
        const dummyModels: AIModel[] = [
          {
            id: '1',
            name: 'GPT-4',
            provider: 'OpenAI',
            description: 'Advanced language model with improved reasoning',
            strengths: ['Complex reasoning', 'Following instructions'],
            limitations: ['May hallucinate facts', 'Limited context window']
          },
          {
            id: '2',
            name: 'Claude',
            provider: 'Anthropic',
            description: 'Helpful, harmless, and honest AI assistant',
            strengths: ['Long context', 'Nuanced responses'],
            limitations: ['Sometimes verbose']
          }
        ];
        
        setModels(dummyModels);
        
        // Format models for display
        const formattedModels = dummyModels.map((model, index) => ({
          model,
          position: index,
          index
        }));
        
        setDisplayModels(formattedModels);
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchModels();
  }, []);

  // Handle model selection
  const handleModelSelect = (model: AIModel) => {
    onSelect(model.id === selectedModel?.id ? null : model);
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">AI Model</h3>
      
      {isInitializingModels || loading ? (
        <div className="animate-pulse flex flex-col gap-2">
          <div className="h-14 bg-gray-200 rounded"></div>
          <div className="h-14 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayModels.map(({ model, index }) => (
            <div
              key={model.id}
              onClick={() => handleModelSelect(model)}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                selectedModel?.id === model.id
                  ? 'border-[#33fea6] bg-[#33fea6]/10'
                  : 'border-gray-200 hover:border-[#33fea6]/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{model.name}</h4>
                  <p className="text-sm text-muted-foreground">{model.provider}</p>
                </div>
                {selectedModel?.id === model.id && (
                  <Check className="h-5 w-5 text-[#33fea6]" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedModel && (
        <div className="mt-4 p-3 border rounded-md bg-muted/20">
          <h4 className="font-medium mb-2">{selectedModel.name}</h4>
          <p className="text-sm mb-2">{selectedModel.description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <h5 className="text-sm font-medium mb-1">Strengths</h5>
              <ul className="text-xs space-y-1 list-disc pl-4">
                {selectedModel.strengths.map((strength, i) => (
                  <li key={i}>{strength}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="text-sm font-medium mb-1">Limitations</h5>
              <ul className="text-xs space-y-1 list-disc pl-4">
                {selectedModel.limitations.map((limitation, i) => (
                  <li key={i}>{limitation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
