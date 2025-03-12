export interface AIModel {
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  limitations: string[];
}

// Update the UploadedImage interface to include context
export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  context?: string;
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  isRelevant: boolean | null;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
  isRelevant: boolean | null;
}
