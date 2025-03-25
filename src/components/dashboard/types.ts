
export interface Question {
  id: string;
  text: string;
  answer?: string;
  isRelevant?: boolean | null;
  category?: string;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  isRelevant: boolean | null;
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
  tags: PromptTag[];
  jsonStructure?: PromptJsonStructure;
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

export interface PromptJsonStructure {
  context?: string;
  objective?: string;
  audience?: string;
  tone?: string;
  format?: string;
  additional?: string;
}

export interface Toggle {
  id: string;
  label: string;
  description?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  maxTokens: number;
  temperature: number;
  contextWindow: number;
  cost: number;
  trainingData: string;
  isAvailable: boolean;
  description?: string;
  logoUrl?: string;
  updatedAt?: string;
}

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  name: string;
}

// Convert Variable array to JSON for storage
export const variablesToJson = (variables: Variable[]) => {
  if (!Array.isArray(variables)) {
    console.error("Variables is not an array:", variables);
    return {};
  }
  
  // Create an object with variable IDs as keys
  const jsonObject: Record<string, any> = {};
  
  variables.forEach(variable => {
    if (variable && variable.id) {
      jsonObject[variable.id] = {
        name: variable.name || '',
        value: variable.value || '',
        isRelevant: variable.isRelevant,
        category: variable.category || 'Other',
        code: variable.code || ''
      };
    }
  });
  
  return jsonObject;
};

// Convert JSON back to Variable array
export const jsonToVariables = (json: any): Variable[] => {
  if (!json) return [];
  
  if (Array.isArray(json)) {
    // If it's already an array, map it to ensure proper Variable structure
    return json.map((v: any) => ({
      id: typeof v.id === 'string' ? v.id : String(v.id || ''),
      name: v.name || '',
      value: v.value || '',
      isRelevant: v.isRelevant === undefined ? null : v.isRelevant,
      category: v.category || 'Other',
      code: v.code || ''
    }));
  }
  
  // If it's an object with variable IDs as keys
  try {
    const variables: Variable[] = [];
    
    if (typeof json === 'object' && json !== null) {
      Object.keys(json).forEach(id => {
        const v = json[id];
        
        variables.push({
          id,
          name: typeof v === 'object' && v !== null ? (v.name || '') : '',
          value: typeof v === 'object' && v !== null ? (v.value || '') : '',
          isRelevant: typeof v === 'object' && v !== null ? 
            (v.isRelevant === undefined ? null : v.isRelevant) : null,
          category: typeof v === 'object' && v !== null ? (v.category || 'Other') : 'Other',
          code: typeof v === 'object' && v !== null ? (v.code || '') : ''
        });
      });
    }
    
    return variables;
  } catch (error) {
    console.error("Error converting JSON to variables:", error);
    return [];
  }
};
