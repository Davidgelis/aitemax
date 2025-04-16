
export interface TechnicalTerm {
  term: string;
  explanation: string;
  example: string;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  category: string;
  isRelevant: boolean | null;
  code?: string;
  technicalTerms?: TechnicalTerm[];
}

export interface Question {
  id: string;
  text: string;
  category: string;
  answer: string;
  isRelevant: boolean;
}

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  context?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  capabilities: string[];
  pricing?: {
    input?: number;
    output?: number;
    unit?: string;
  };
  isRecommended?: boolean;
  lastUpdated?: string;
}

export interface Toggle {
  id: string;
  label: string;
  definition: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  variables?: Record<string, any>;
  questions?: Record<string, any>;
  masterCommand?: string;
  primaryToggle?: string | null;
  secondaryToggle?: string | null;
  tags?: PromptTag[];
}

export interface PromptJsonStructure {
  questions: Question[];
  variables: Variable[];
  masterCommand: string;
  enhancedPrompt: string;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
}

export interface PromptTag {
  id: string;
  name: string;
  color?: string;
}

// Helper functions for variable conversion
export const variablesToJson = (variables: Variable[]): Record<string, any> => {
  return variables.reduce((acc, variable) => {
    acc[variable.id] = {
      name: variable.name,
      value: variable.value,
      category: variable.category,
      isRelevant: variable.isRelevant,
      code: variable.code,
      technicalTerms: variable.technicalTerms
    };
    return acc;
  }, {} as Record<string, any>);
};

export const jsonToVariables = (json: Record<string, any> | null): Variable[] => {
  if (!json) return [];
  
  return Object.entries(json).map(([id, value]) => ({
    id,
    name: value.name || '',
    value: value.value || '',
    category: value.category || '',
    isRelevant: value.isRelevant !== undefined ? value.isRelevant : true,
    code: value.code,
    technicalTerms: value.technicalTerms || []
  }));
};
