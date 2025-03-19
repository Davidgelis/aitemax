
export interface Question {
  id: string;
  text: string;
  isRelevant: boolean | null;
  answer?: string;
  category?: string;
}

export interface Variable {
  id: string;
  name: string;
  description: string;
  value: string;
  isRelevant: boolean | null;
  category?: string;
  code?: string;
}

export interface Toggle {
  id: string;
  label: string;
  definition?: string;
  prompt?: string;
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

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  context?: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  date: string;
  promptText: string;
  primaryToggle: string | null;
  secondaryToggle: string | null;
  masterCommand?: string;
  variables: Variable[];
  jsonStructure?: PromptJsonStructure;
  isPrivate?: boolean;
}

export interface PromptJsonStructure {
  [key: string]: any;
}

export const variablesToJson = (variables: Variable[]): { [key: string]: any } => {
  return variables.reduce((acc: { [key: string]: any }, variable: Variable) => {
    acc[variable.name] = {
      description: variable.description,
      value: variable.value,
      isRelevant: variable.isRelevant,
    };
    return acc;
  }, {});
};

export const jsonToVariables = (json: any): Variable[] => {
  if (!json) return [];

  return Object.entries(json).map(([name, data]: [string, any], index: number) => {
    const id = `variable-${index}-${name}`;
    return {
      id: id,
      name: name,
      description: data.description || '',
      value: data.value || '',
      isRelevant: data.isRelevant !== undefined ? data.isRelevant : null,
    };
  });
};
