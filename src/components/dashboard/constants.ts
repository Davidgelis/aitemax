
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
  { id: "q2", text: "Who is the target audience for this content?", isRelevant: null, answer: "", category: "Persona" },
  { id: "q3", text: "What specific formatting guidelines should be applied?", isRelevant: null, answer: "", category: "Conditions" },
  { id: "q4", text: "How should the final output be structured?", isRelevant: null, answer: "", category: "Instructions" },
  { id: "q5", text: "Are there any specific examples you want included?", isRelevant: null, answer: "", category: "Task" },
  { id: "q6", text: "What level of technical detail should be included?", isRelevant: null, answer: "", category: "Conditions" },
  { id: "q7", text: "Any specific terminology or jargon to include or avoid?", isRelevant: null, answer: "", category: "Conditions" },
  { id: "q8", text: "What tone would you like the content to have?", isRelevant: null, answer: "", category: "Persona" },
  { id: "q9", text: "Are there any length constraints for the output?", isRelevant: null, answer: "", category: "Conditions" },
  { id: "q10", text: "What validation steps should be included?", isRelevant: null, answer: "", category: "Instructions" },
  { id: "q11", text: "Any specific sources or references to include?", isRelevant: null, answer: "", category: "Task" },
  { id: "q12", text: "What additional context is needed for this task?", isRelevant: null, answer: "", category: "Task" },
];

export const defaultVariables: Variable[] = [
  { id: "v1", name: "Name", value: "", isRelevant: null },
  { id: "v2", name: "Purpose", value: "", isRelevant: null },
  { id: "v3", name: "Context", value: "", isRelevant: null },
  { id: "v4", name: "Audience", value: "", isRelevant: null },
  { id: "v5", name: "OutputFormat", value: "", isRelevant: null },
];

export const sampleFinalPrompt = `# Enhanced Prompt Template

## Task
Your task is to analyze and provide insights on the given topic, breaking down complex concepts into understandable components.

## Persona
You will act as an expert in the field, maintaining a professional yet accessible tone throughout your response.

## Conditions
- Structure your response with clear headings and subheadings
- Include relevant examples to illustrate key points
- Avoid jargon where possible, or explain technical terms when used
- Use {{Context}} to inform your analysis approach

## Instructions
1. Begin by summarizing the {{Purpose}} in 2-3 sentences
2. Identify the core elements of the topic for {{Name}}
3. Provide a detailed analysis of each element
4. Conclude with practical applications or next steps
5. Include references or further reading if appropriate`;

export const QUESTIONS_PER_PAGE = 3;
