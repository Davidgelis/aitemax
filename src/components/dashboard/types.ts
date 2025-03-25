export interface Question {
  id: string;
  text: string;
  answer?: string;
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
  tags: PromptTag[];
}

export interface PromptTag {
  category: string;
  subcategory?: string;
}

export interface PromptPillar {
  id: string;
  name: string;
  content: string;
  order: number;
  isEditable: boolean;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description?: string;
  pillars: PromptPillar[];
  isDefault: boolean;
  maxChars?: number;
  temperature?: number;
  systemPrefix?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}
