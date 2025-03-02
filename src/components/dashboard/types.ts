
import { Json } from "@/integrations/supabase/types";

export interface Question {
  id: string;
  text: string;
  isRelevant: boolean | null;
  answer: string;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  isRelevant: boolean | null;
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
          isRelevant: (item as any).isRelevant === true
        } as Variable;
      }
      // Return a default variable if item is not an object
      return { id: `v${Date.now()}`, name: '', value: '', isRelevant: null } as Variable;
    });
  }
  return [];
};
