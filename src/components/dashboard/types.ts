
import { Json } from "@/integrations/supabase/types";

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  context?: string;
}

export interface PromptTag {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
}

export interface PromptJsonStructure {
  promptText: string;
  questions: Question[];
  variables: Variable[];
  masterCommand: string;
  finalPrompt: string;
  primaryToggle: string | null;
  secondaryToggle: string | null;
  tags: PromptTag[];
  title?: string;
  summary?: string;
}

export interface SavedPrompt {
  id: string;
  created_at: string;
  title: string;
  prompt_json: PromptJsonStructure;
  user_id: string;
  tags: PromptTag[];
  // Additional properties needed by the app
  date?: string;
  promptText?: string;
  masterCommand?: string;
  primaryToggle?: string | null;
  secondaryToggle?: string | null;
  variables?: Variable[];
  jsonStructure?: PromptJsonStructure;
}

export interface Question {
  id: string;
  text: string;
  isRelevant: boolean | null;
  answer: string;
  category: string;
  technicalTerms?: TechnicalTerm[];
}

export interface TechnicalTerm {
  term: string;
  explanation: string;
  example: string;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  isRelevant: boolean | null;
  category: string;
  code?: string;
  technicalTerms?: TechnicalTerm[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  limitations: string[];
  updated_at?: string;
}

export interface Toggle {
  id: string;
  name: string;
  description: string;
  category: "primary" | "secondary";
  label: string;
  definition: string;
  prompt?: string;
}

// Utility functions for JSON conversion
export const variablesToJson = (variables: Variable[]): Json => {
  return variables as unknown as Json;
};

export const jsonToVariables = (json: Json): Variable[] => {
  if (!json || !Array.isArray(json)) {
    return [];
  }
  return json as unknown as Variable[];
};
