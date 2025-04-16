
export interface TechnicalTerm {
  term: string;
  explanation: string;
  example: string;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  category: string;
  isRelevant: boolean | null;
  code?: string;
  technicalTerms?: TechnicalTerm[];
}
