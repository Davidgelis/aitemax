
import { ModelSelector as ModelSelectorComponent } from './model-selector';
import { AIModel } from './types';

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
    <ModelSelectorComponent
      selectedModel={selectedModel}
      onSelect={setSelectedModel}
      isInitializingModels={isInitializingModels}
    />
  );
};
