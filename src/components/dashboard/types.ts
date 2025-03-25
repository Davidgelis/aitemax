
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

// Define a proper type for the tag structure
export interface PromptTag {
  category: string;
  subcategory: string;
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
  tags?: PromptTag[]; // Update this to use the proper type
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

// Define a Prompt Pillar interface for template structure
export interface PromptPillar {
  id: string;
  name: string;
  content: string;
  order: number;
  isEditable: boolean;
}

// Define a Prompt Template interface
export interface PromptTemplate {
  id?: string;
  title: string;
  description?: string;
  isDefault: boolean;
  pillars: PromptPillar[];
  systemPrefix?: string;
  maxChars?: number;
  temperature: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
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

// Helper functions for template serialization/deserialization
export const templatePillarsToJson = (pillars: PromptPillar[]): Json => {
  if (!pillars || !Array.isArray(pillars)) return [];
  
  // Convert the pillars array to a simple object structure that matches Json type
  return pillars.map(pillar => ({
    id: pillar.id,
    name: pillar.name,
    content: pillar.content,
    order: pillar.order,
    isEditable: pillar.isEditable
  })) as Json;
};

export const jsonToPillars = (json: Json | null): PromptPillar[] => {
  if (!json || !Array.isArray(json)) return [];
  
  const pillars: PromptPillar[] = [];
  
  // Convert from JSON array to PromptPillar array
  json.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      // Type assertion to ensure TypeScript knows these properties exist
      const jsonItem = item as Record<string, any>;
      pillars.push({
        id: jsonItem.id as string || crypto.randomUUID(),
        name: jsonItem.name as string || '',
        content: jsonItem.content as string || '',
        order: jsonItem.order as number || 0,
        isEditable: jsonItem.isEditable as boolean ?? true
      });
    }
  });
  
  // Sort pillars by order
  return pillars.sort((a, b) => a.order - b.order);
};
