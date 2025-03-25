
import { ModelSelector as OriginalModelSelector } from './index';
import { AIModel } from '../types';

interface ModelSelectorProps {
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel | null) => void;
  isInitializingModels?: boolean;
}

export const ModelSelector = ({ 
  selectedModel, 
  setSelectedModel, 
  isInitializingModels = false 
}: ModelSelectorProps) => {
  return (
    <OriginalModelSelector
      onSelect={setSelectedModel}
      selectedModel={selectedModel}
      isInitializingModels={isInitializingModels}
    />
  );
};
