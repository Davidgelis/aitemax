
export interface Question {
  id: string;
  text: string;
  category: string;
  isRelevant: boolean | null;
  answer?: string;
  contextSource?: string;
  examples?: string[];
  prefillSource?: 'image-scan' | 'context' | 'prompt'; // Added prefillSource type
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  category?: string;
  isRelevant?: boolean | null;
  code?: string;
  prefillSource?: 'image-scan' | 'context' | 'prompt'; // Added prefillSource type
}
