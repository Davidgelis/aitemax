import { Json } from "@/integrations/supabase/types";

export interface UploadedImage {
  url: string;
  file: File;
}

export interface PromptTag {
  id: string;
  name: string;
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
}

export interface SavedPrompt {
  id: string;
  created_at: string;
  title: string;
  prompt_json: PromptJsonStructure;
  user_id: string;
  tags: PromptTag[];
}

export interface Question {
  id: string;
  text: string;
  isRelevant: boolean | null;
  answer: string;
  category: string;
  technicalTerms?: TechnicalTerm[];
}

// Add TechnicalTerm interface
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
  technicalTerms?: TechnicalTerm[]; // Add this field
}

export interface AIModel {
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  limitations: string[];
}
