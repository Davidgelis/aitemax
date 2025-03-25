
import { AIModel } from '../types';

export interface ModelSelectorProps {
  onSelect: (model: AIModel | null) => void;
  selectedModel: AIModel | null;
  isInitializingModels?: boolean;
}

export interface DisplayModel {
  model: AIModel;
  position: number;
  index: number;
}
