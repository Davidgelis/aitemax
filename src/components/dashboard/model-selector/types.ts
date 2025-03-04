
import { AIModel } from '../types';

export interface ModelSelectorProps {
  onSelect: (model: AIModel | null) => void;
  isInitializingModels?: boolean;
  selectedModel: AIModel | null;
}

export interface DisplayModel {
  model: AIModel;
  position: number;
  index: number;
}
