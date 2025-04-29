
export interface Question {
  id: string;
  text: string;
  answer: string;
  isRelevant: boolean | null;
  category: string;
  contextSource?: "image" | "website" | "manual";
  prefillSource?: "image" | "website" | "manual";
  technicalTerms?: TechnicalTerm[];
  isDuplicate?: boolean;
  examples?: string[];
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
  code: string;
  contextSource?: string;
  prefillSource?: "image" | "website" | "manual";
}
