
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
}

export interface PromptSection {
  type: string;
  content: string;
  variables: {name: string, value: string}[];
}

export interface PromptJsonStructure {
  title: string;
  sections: PromptSection[];
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
  jsonStructure?: PromptJsonStructure | null;
}

export interface Toggle {
  label: string;
  id: string;
}

// Helper function to convert between Variable[] and Json
export const variablesToJson = (variables: Variable[]): Json => {
  return variables as unknown as Json;
};

// Helper function to convert Json to Variable[]
export const jsonToVariables = (json: Json | null): Variable[] => {
  if (!json) return [];
  // Ensure the Json is an array before casting
  if (Array.isArray(json)) {
    // Cast each item in the array to ensure it has the correct structure
    return json.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          id: (item as any).id || `v${Date.now()}`,
          name: (item as any).name || '',
          value: (item as any).value || '',
          isRelevant: (item as any).isRelevant === true,
          category: (item as any).category || 'Task'
        } as Variable;
      }
      // Return a default variable if item is not an object
      return { id: `v${Date.now()}`, name: '', value: '', isRelevant: null, category: 'Task' } as Variable;
    });
  }
  return [];
};
