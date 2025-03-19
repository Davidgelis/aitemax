import { Json } from "@/integrations/supabase/types";

export interface AIModel {
  id?: string;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  limitations: string[];
  updated_at?: string;
}

// Update the UploadedImage interface to include context
export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  context?: string;
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  isRelevant: boolean | null;
  category?: string; // Task, Persona, Conditions, Instructions categories
  prefillSource?: string;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  isRelevant: boolean | null;
  category?: string; // Task, Persona, Conditions, Instructions categories
  code?: string;
}

export interface Toggle {
  id: string;
  label: string;
  definition: string;
  prompt: string;
}

export interface SavedPrompt {
  id?: string;
  title: string;
  date: string;
  promptText: string;
  masterCommand: string;
  primaryToggle: string | null;
  secondaryToggle: string | null;
  variables: Variable[];
  jsonStructure?: PromptJsonStructure;
  tags?: Array<{category: string, subcategory: string}>;
}

export interface PromptJsonStructure {
  title?: string;
  summary?: string;
  sections?: Array<{ title: string; content: string }>;
  error?: string;
  generationError?: string;
  masterCommand?: string;
  timestamp?: string; // Make timestamp optional and ensure it's removed in UI
  variablePlaceholders?: string[];
  task?: string;
  persona?: string;
  conditions?: string;
  instructions?: string;
  [key: string]: any; // Allow for any additional properties
}

// Helper functions for variable serialization/deserialization with updated types
export const variablesToJson = (variables: Variable[]): Record<string, any> => {
  if (!variables || !Array.isArray(variables)) return {};
  
  const result: Record<string, any> = {};
  variables.forEach(variable => {
    if (variable && variable.id) {
      result[variable.id] = {
        name: variable.name,
        value: variable.value,
        isRelevant: variable.isRelevant,
        category: variable.category,
        code: variable.code
      };
    }
  });
  
  return result;
};

// Update jsonToVariables to handle Json type from Supabase
export const jsonToVariables = (json: Json | Record<string, any> | null): Variable[] => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [];
  
  const variables: Variable[] = [];
  Object.keys(json).forEach(id => {
    const varData = json[id];
    if (varData && typeof varData === 'object' && !Array.isArray(varData)) {
      variables.push({
        id,
        name: varData.name || '',
        value: varData.value || '',
        isRelevant: varData.isRelevant === undefined ? null : varData.isRelevant,
        category: varData.category || 'Other',
        code: varData.code || ''
      });
    }
  });
  
  return variables;
};
