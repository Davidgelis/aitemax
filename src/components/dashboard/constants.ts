import { Question, Toggle, Variable } from "./types";

export const primaryToggles: Toggle[] = [
  { label: "Complex Reasoning", id: "complex" },
  { label: "Mathematical Problem-Solving", id: "math" },
  { label: "Coding", id: "coding" },
  { label: "Copilot", id: "copilot" },
  { label: "Image Creating", id: "image" },
];

export const secondaryToggles: Toggle[] = [
  { label: "Token Saver prompt", id: "token" },
  { label: "Strict Response", id: "strict" },
  { label: "Creative", id: "creative" },
];

export const loadingMessages = [
  "AI is analyzing your prompt across four pillars: Task, Persona, Conditions, and Instructions...",
  "Identifying key gaps and missing elements in your prompt structure...",
  "Detecting potential variables and placeholders for customization...",
  "Generating targeted questions to improve your prompt effectiveness...",
  "Preparing enhanced prompt structure and recommendations..."
];

export const mockQuestions: Question[] = [
  // Task-focused questions about broader context
  { id: "q1", text: "What is the scale or complexity of the data you're working with?", isRelevant: null, answer: "", category: "Task" },
  { id: "q2", text: "Are there any specific performance concerns or constraints?", isRelevant: null, answer: "", category: "Task" },
  
  // Persona-focused questions about users and audience
  { id: "q3", text: "Who will be using the output of this prompt?", isRelevant: null, answer: "", category: "Persona" },
  { id: "q4", text: "What is the technical expertise of the end users?", isRelevant: null, answer: "", category: "Persona" },
  
  // Conditions-focused questions about limitations
  { id: "q5", text: "Are there any security or privacy considerations?", isRelevant: null, answer: "", category: "Conditions" },
  { id: "q6", text: "What is the expected frequency of use for this solution?", isRelevant: null, answer: "", category: "Conditions" },
  
  // Instructions-focused questions about implementation details
  { id: "q7", text: "Should the solution prioritize readability or efficiency?", isRelevant: null, answer: "", category: "Instructions" },
  { id: "q8", text: "Are there any specific coding patterns or styles to follow?", isRelevant: null, answer: "", category: "Instructions" },
];

export const defaultVariables: Variable[] = [
  // More specific variables with meaningful names
  { id: "v1", name: "ContentType", value: "", isRelevant: null, category: "Task" },
  { id: "v2", name: "Objective", value: "", isRelevant: null, category: "Task" },
  { id: "v3", name: "Audience", value: "", isRelevant: null, category: "Persona" },
  { id: "v4", name: "ToneStyle", value: "", isRelevant: null, category: "Persona" },
  { id: "v5", name: "Deadline", value: "", isRelevant: null, category: "Conditions" },
  { id: "v6", name: "WordCount", value: "", isRelevant: null, category: "Conditions" },
  { id: "v7", name: "Format", value: "", isRelevant: null, category: "Instructions" },
  { id: "v8", name: "CallToAction", value: "", isRelevant: null, category: "Instructions" },
];

export const sampleFinalPrompt = `# Enhanced Prompt Template

## Task
Your task is to {{ContentType}} and produce {{Objective}}.

## Persona
You will address {{Audience}} while maintaining a {{ToneStyle}} throughout your response.

## Conditions
- Complete this within {{Deadline}}
- Keep the response around {{WordCount}} words

## Instructions
1. Structure your response with {{Format}}
2. End with {{CallToAction}}

## Notes
This prompt has been optimized based on the four-pillar framework: Task, Persona, Conditions, and Instructions.`;

export const QUESTIONS_PER_PAGE = 3;

// Helper function to filter out category names from variables
export const filterCategoryVariables = (variables: Variable[]): Variable[] => {
  return variables.filter(v => 
    v.name !== 'Task' && 
    v.name !== 'Persona' && 
    v.name !== 'Conditions' && 
    v.name !== 'Instructions'
  );
};

// Generate context-specific default questions based on prompt type
export const generateContextQuestions = (promptText: string): Question[] => {
  const lowerPrompt = promptText.toLowerCase();
  
  // For Google Sheets / spreadsheet scripts
  if (lowerPrompt.includes('google sheet') || lowerPrompt.includes('spreadsheet') || lowerPrompt.includes('excel')) {
    return [
      { id: "q1", text: "How many rows of data will typically be processed?", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Is this script meant to run automatically or manually?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q3", text: "Will non-technical users need to modify the script later?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q4", text: "Are there any performance concerns with large datasets?", isRelevant: null, answer: "", category: "Instructions" },
    ];
  }
  
  // For email-related prompts
  if (lowerPrompt.includes('email') || lowerPrompt.includes('message') || lowerPrompt.includes('communication')) {
    return [
      { id: "q1", text: "What is the ongoing relationship with the recipient?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q2", text: "Is this a one-time message or part of a series?", isRelevant: null, answer: "", category: "Task" },
      { id: "q3", text: "Are there any sensitive topics to approach carefully?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "What's the expected response you're hoping to receive?", isRelevant: null, answer: "", category: "Instructions" },
    ];
  }
  
  // For coding/programming tasks
  if (lowerPrompt.includes('code') || lowerPrompt.includes('script') || lowerPrompt.includes('program') || lowerPrompt.includes('function')) {
    return [
      { id: "q1", text: "What is the expected execution environment?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q2", text: "Are there any specific libraries or dependencies to use or avoid?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q3", text: "What scale of data will this solution need to handle?", isRelevant: null, answer: "", category: "Task" },
      { id: "q4", text: "Who will maintain this code in the future?", isRelevant: null, answer: "", category: "Persona" },
    ];
  }
  
  // Default to general context questions
  return mockQuestions;
};
