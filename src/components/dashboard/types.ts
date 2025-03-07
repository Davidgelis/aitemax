
import { Json } from "@/integrations/supabase/types";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  limitations: string[];
  is_deleted?: boolean | null;
  updated_at?: string | null;
}

export interface Question {
  id: string;
  text: string;
  isRelevant: boolean | null;
  answer: string;
  category: string;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  isRelevant: boolean | null;
  category?: string;
  occurrences?: string[];
  code?: string;
}

export interface PromptSection {
  title: string;
  content: string;
}

export interface PromptJsonStructure {
  title: string;
  summary: string;
  sections: PromptSection[];
  variables: Variable[];
  masterCommand?: string;
  timestamp?: string;
  error?: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  date: string;
  promptText: string;
  masterCommand: string;
  primaryToggle: string | null;
  secondaryToggle: string | null;
  variables: Variable[];
  jsonStructure?: PromptJsonStructure;
}

export interface Toggle {
  id: string;
  label: string;
  definition?: string;
  prompt?: string;
}

export const variablesToJson = (variables: Variable[]): Json => {
  return variables as unknown as Json;
};

export const jsonToVariables = (json: Json | null): Variable[] => {
  if (!json) return [];
  if (Array.isArray(json)) {
    return json.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          id: (item as any).id || `v${Date.now()}`,
          name: (item as any).name || '',
          value: (item as any).value || '',
          isRelevant: (item as any).isRelevant === true,
          category: (item as any).category || 'Task',
          occurrences: (item as any).occurrences || [],
          code: (item as any).code || ''
        } as Variable;
      }
      return { id: `v${Date.now()}`, name: '', value: '', isRelevant: null, category: 'Task', code: '' } as Variable;
    });
  }
  return [];
};
