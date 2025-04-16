
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
  technicalTerms?: TechnicalTerm[]; // Added to support QuestionList component
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
  strengths?: string[]; // Added to support ModelTooltip and related components
  limitations?: string[]; // Added to support ModelTooltip and related components
  updated_at?: string; // Added to support useModelSelector
  is_deleted?: boolean; // Added to support model services
  created_at?: string; // Added to support model services
}

export interface Toggle {
  id: string;
  label: string;
  definition: string;
  prompt: string; // Added to support constants.ts usage
}

export interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  promptText?: string; // Added for backward compatibility
  created_at: string;
  updated_at: string;
  user_id: string;
  variables?: Variable[] | Record<string, any>;
  questions?: Record<string, any>;
  masterCommand?: string;
  primaryToggle?: string | null;
  secondaryToggle?: string | null;
  tags?: PromptTag[];
  date?: string; // Added to support existing code
  jsonStructure?: PromptJsonStructure; // Added to support usePromptState
}

export interface PromptJsonStructure {
  questions: Question[];
  variables: Variable[];
  masterCommand: string;
  enhancedPrompt: string;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  title?: string; // Added to support FinalPromptDisplay
  summary?: string; // Added to support FinalPromptDisplay
}

export interface PromptTag {
  id: string;
  name: string;
  color?: string;
  category?: string; // Added to support XPanel and PromptView
  subcategory?: string; // Added to support XPanel and PromptView
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

export const jsonToVariables = (json: Record<string, any> | null | any): Variable[] => {
  if (!json) return [];
  
  // Added type safety checks
  if (typeof json !== 'object') return [];
  
  // If it's already an array of Variables, return it
  if (Array.isArray(json) && json.length > 0 && 'id' in json[0]) {
    return json as Variable[];
  }
  
  return Object.entries(json).map(([id, value]) => {
    // Handle the case where value might not be an object
    if (typeof value !== 'object' || value === null) {
      return {
        id,
        name: '',
        value: '',
        category: '',
        isRelevant: true,
        code: undefined,
        technicalTerms: []
      };
    }

    // Safely access properties with proper type checking
    const val = value as Record<string, any>;
    const name = typeof val.name === 'string' ? val.name : '';
    const valStr = typeof val.value === 'string' ? val.value : '';
    const category = typeof val.category === 'string' ? val.category : '';
    const isRelevant = typeof val.isRelevant === 'boolean' ? val.isRelevant : true;
    const code = val.code;
    const technicalTerms = Array.isArray(val.technicalTerms) ? val.technicalTerms : [];

    return {
      id,
      name,
      value: valStr,
      category,
      isRelevant,
      code,
      technicalTerms
    };
  });
};
