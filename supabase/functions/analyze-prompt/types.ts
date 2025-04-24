
export interface Question {
  id: string;
  text: string;
  answer: string;
  isRelevant: boolean | null;
  category: string;
  contextSource?: string;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  isRelevant: boolean | null;
  category: string;
  code: string;
}
