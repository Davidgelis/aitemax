
import { Question, Toggle, Variable } from "./types";

export const primaryToggles: Toggle[] = [
  { label: "Complex Reasoning", id: "complex" },
  { label: "Mathematical Problem-Solving", id: "math" },
  { label: "Coding", id: "coding" },
  { label: "Creating a copilot", id: "copilot" },
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
  // Task-focused questions about WHAT needs to be done
  { id: "q1", text: "What exactly do you want to accomplish with this?", isRelevant: null, answer: "", category: "Task" },
  { id: "q2", text: "How would you describe your ideal outcome?", isRelevant: null, answer: "", category: "Task" },
  
  // Persona-focused questions about WHO and TONE
  { id: "q3", text: "What is your relationship with the recipient?", isRelevant: null, answer: "", category: "Persona" },
  { id: "q4", text: "Should the tone be formal, casual, or something else?", isRelevant: null, answer: "", category: "Persona" },
  
  // Conditions-focused questions about LIMITATIONS
  { id: "q5", text: "Are there any sensitive topics to avoid?", isRelevant: null, answer: "", category: "Conditions" },
  { id: "q6", text: "How long should the final result be?", isRelevant: null, answer: "", category: "Conditions" },
  
  // Instructions-focused questions about HOW to proceed
  { id: "q7", text: "Should specific points be included in order of importance?", isRelevant: null, answer: "", category: "Instructions" },
  { id: "q8", text: "Do you want suggestions for follow-up actions?", isRelevant: null, answer: "", category: "Instructions" },
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
