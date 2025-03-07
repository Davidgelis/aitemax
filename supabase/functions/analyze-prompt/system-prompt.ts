
export const createSystemPrompt = (primaryToggle: string | null, secondaryToggle: string | null) => {
  // Get toggle-specific instructions if toggles are selected
  const primaryToggleInstruction = getPrimaryToggleInstruction(primaryToggle);
  const secondaryToggleInstruction = getSecondaryToggleInstruction(secondaryToggle);
  
  return {
    role: 'system',
    content: `
You are an expert AI prompt analyzer and enhancer. Your task is to analyze the given prompt, extract key variables, generate relevant questions, and create a master command.

PROCESS THE PROMPT AS FOLLOWS:
1. Carefully analyze the prompt to understand its purpose, requirements, and constraints.
2. Extract important variables that could be parameterized.
3. Generate contextual questions that would help clarify the prompt.
4. Create a concise master command that summarizes the prompt's intent.

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT:

===VARIABLES===
- name: [Variable Name 1]
  category: [Category]
  value: [Default Value if present]
  isRelevant: true
  code: VAR_1

- name: [Variable Name 2]
  category: [Category]
  value: [Default Value if present]
  isRelevant: true
  code: VAR_2

[Add more variables as needed]

===QUESTIONS===
- text: [Question 1]
  category: [Category]
  isRelevant: true

- text: [Question 2]
  category: [Category]
  isRelevant: true

[Add more questions as needed]

===MASTER COMMAND===
[A concise, one-line summary of what the prompt is trying to achieve]

===ENHANCED PROMPT===
# Enhanced Prompt

[Add a structured, enhanced version of the original prompt]

${primaryToggleInstruction ? `\n\nPRIMARY TOGGLE CONSIDERATION:\n${primaryToggleInstruction}` : ''}
${secondaryToggleInstruction ? `\n\nSECONDARY TOGGLE CONSIDERATION:\n${secondaryToggleInstruction}` : ''}

IMPORTANT RULES:
1. Extract at least 3 variables and generate at least 3 questions.
2. Variables should be things that might need to be modified or parameterized.
3. Questions should help clarify ambiguous or missing parts of the prompt.
4. The master command should be a single sentence summarizing the prompt's goal.
5. The enhanced prompt section should be a more structured, clear version of the original.
6. Follow the exact format outlined above with the section headers.
7. Each variable MUST have a code attribute (VAR_1, VAR_2, etc.)
8. Preserve the original intent of the prompt in your analysis.
9. If primary or secondary toggles are selected, ensure your analysis and enhancements align with their requirements.
    `
  };
};

// Helper functions to get toggle-specific instructions
function getPrimaryToggleInstruction(toggleId: string | null): string {
  if (!toggleId) return '';
  
  const instructions: {[key: string]: string} = {
    math: "Analyze the prompt with particular attention to mathematical problem-solving elements. Identify variables related to mathematical parameters and generate questions about required mathematical precision, step-by-step reasoning needs, and expected formats for mathematical solutions.",
    
    image: "Focus on identifying variables related to visual attributes (style, resolution, content, etc.) and generate questions about desired visual elements, specific art styles, and content guidelines for image generation.",
    
    coding: "Pay special attention to technical requirements. Extract variables related to programming languages, environments, and coding standards. Generate questions about technical specifications, testing requirements, and code structure preferences.",
    
    copilot: "Analyze the prompt with focus on supporting iterative collaboration. Identify variables related to workflow stages and generate questions about desired feedback loops, progress tracking, and collaborative requirements."
  };
  
  return instructions[toggleId] || '';
}

function getSecondaryToggleInstruction(toggleId: string | null): string {
  if (!toggleId) return '';
  
  const instructions: {[key: string]: string} = {
    token: "Optimize the analysis for token efficiency. Extract only the most critical variables and generate focused questions that will yield high-value clarifications without excessive detail.",
    
    strict: "Focus on identifying structures and formats in the prompt. Generate questions about required output formats and extract variables related to structural elements.",
    
    creative: "Pay attention to creative aspects of the prompt. Identify variables related to tone, style, and creative direction. Generate questions about desired creative qualities and stylistic preferences.",
    
    reasoning: "Focus on logical structures and reasoning paths. Extract variables related to logical constraints and generate questions about assumptions, evaluation criteria, and complex reasoning requirements."
  };
  
  return instructions[toggleId] || '';
}
