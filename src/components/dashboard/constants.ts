
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
  { id: "q1", text: "What are you trying to accomplish?", isRelevant: null, answer: "", category: "Task" },
  { id: "q2", text: "What should the final result look like?", isRelevant: null, answer: "", category: "Task" },
  { id: "q3", text: "Who is this for?", isRelevant: null, answer: "", category: "Persona" },
  { id: "q4", text: "What tone should be used?", isRelevant: null, answer: "", category: "Persona" },
  { id: "q5", text: "Are there any specific requirements?", isRelevant: null, answer: "", category: "Conditions" },
  { id: "q6", text: "What limits or constraints should be considered?", isRelevant: null, answer: "", category: "Conditions" },
  { id: "q7", text: "What steps need to be followed?", isRelevant: null, answer: "", category: "Instructions" },
  { id: "q8", text: "How should the information be organized?", isRelevant: null, answer: "", category: "Instructions" },
];

export const defaultVariables: Variable[] = [
  { id: "v1", name: "TaskName", value: "", isRelevant: null, category: "Task" },
  { id: "v2", name: "Outcome", value: "", isRelevant: null, category: "Task" },
  { id: "v3", name: "Audience", value: "", isRelevant: null, category: "Persona" },
  { id: "v4", name: "Tone", value: "", isRelevant: null, category: "Persona" },
  { id: "v5", name: "Format", value: "", isRelevant: null, category: "Conditions" },
  { id: "v6", name: "Constraints", value: "", isRelevant: null, category: "Conditions" },
  { id: "v7", name: "Steps", value: "", isRelevant: null, category: "Instructions" },
  { id: "v8", name: "Structure", value: "", isRelevant: null, category: "Instructions" },
];

export const sampleFinalPrompt = `# Enhanced Prompt Template

## Task
Your task is to {{TaskName}} and produce {{Outcome}}.

## Persona
You will act as an expert addressing {{Audience}} while maintaining a {{Tone}} throughout your response.

## Conditions
- Structure your response with {{Format}}
- Work within these {{Constraints}}

## Instructions
1. Follow these {{Steps}} precisely
2. Structure your output according to {{Structure}}

## Notes
This prompt has been optimized based on the four-pillar framework: Task, Persona, Conditions, and Instructions.`;

export const QUESTIONS_PER_PAGE = 3;
