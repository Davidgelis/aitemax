
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
  { id: "q1", text: "What is the primary goal of this task?", isRelevant: null, answer: "", category: "Task" },
  { id: "q2", text: "What specific outcomes should be achieved?", isRelevant: null, answer: "", category: "Task" },
  { id: "q3", text: "Who is the target audience for this content?", isRelevant: null, answer: "", category: "Persona" },
  { id: "q4", text: "What tone or communication style should be used?", isRelevant: null, answer: "", category: "Persona" },
  { id: "q5", text: "What specific formatting guidelines should be applied?", isRelevant: null, answer: "", category: "Conditions" },
  { id: "q6", text: "Are there any constraints or limitations to consider?", isRelevant: null, answer: "", category: "Conditions" },
  { id: "q7", text: "What steps should be followed to complete this task?", isRelevant: null, answer: "", category: "Instructions" },
  { id: "q8", text: "How should the final output be structured?", isRelevant: null, answer: "", category: "Instructions" },
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
