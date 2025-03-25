
import { Json } from "@/integrations/supabase/types";

export interface Question {
  id: string;
  text: string;
  answer?: string;
  isRelevant?: boolean | null;
}

export interface Variable {
  id: string;
  name: string;
  description?: string;
  value: string;
  isRelevant?: boolean | null;
  category?: string;
  code?: string;
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
  templateId: string | null;
  tags: PromptTag[];
}

export interface PromptTag {
  name?: string;
  category?: string;
  subcategory?: string;
  confidence?: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string | null;
  description: string | null;
  strengths: string[];
  limitations: string[];
  updated_at?: string | null;
}

export interface UploadedImage {
  id: string;
  url: string;
  file?: File;
  context?: string;
}

export interface PromptJsonStructure {
  [key: string]: any;
}

export const variablesToJson = (variables: Variable[]): Json => {
  return JSON.stringify(variables);
};

export const jsonToVariables = (json: Json): Variable[] => {
  try {
    if (typeof json === 'string') {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } else if (Array.isArray(json)) {
      return json as any as Variable[];
    }
    return [];
  } catch (e) {
    console.error("Failed to parse JSON to variables", e);
    return [];
  }
};

export interface PillarConfig {
  type?: string;
  name: string;
  description: string;
  examples?: string[];
  order?: number;
  required?: boolean;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  systemPrefix: string;
  pillars: PillarConfig[];
  isDefault: boolean;
  maxChars: number;
  temperature: number;
  createdAt: string;
  updatedAt: string;
}

export interface Toggle {
  id: string;
  label: string;
  description?: string;
}

