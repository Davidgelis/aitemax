
import { Toggle } from "./types";

export const defaultVariables = [
  {
    id: "v-1",
    name: "Input",
    value: "",
    isRelevant: null,
    category: "General",
    code: "VAR_1"
  },
  {
    id: "v-2",
    name: "Output Format",
    value: "",
    isRelevant: null,
    category: "General",
    code: "VAR_2"
  },
  {
    id: "v-3",
    name: "Context",
    value: "",
    isRelevant: null,
    category: "General",
    code: "VAR_3"
  },
];

export const loadingMessages = [
  "Analyzing your prompt...",
  "Identifying key variables...",
  "Extracting important contexts...",
  "Generating relevant questions...",
  "Preparing prompt elements...",
  "Finalizing analysis..."
];

export const placeholderTestQuestions = [
  {
    id: "q-placeholder-1",
    text: "What is the desired tone of the output?",
    answer: "",
    isRelevant: null,
    category: "Style"
  },
  {
    id: "q-placeholder-2",
    text: "Are there any specific constraints or limitations?",
    answer: "",
    isRelevant: null,
    category: "Constraints"
  }
];

export const filterCategoryVariables = (variables: any[]) => {
  return variables.filter(v => 
    v.name !== 'Task' && 
    v.name !== 'Persona' && 
    v.name !== 'Conditions' && 
    v.name !== 'Instructions'
  );
};

export const mockQuestions = [
  {
    id: "q-1",
    text: "What is the desired tone of the output?",
    answer: "",
    isRelevant: null,
    category: "Style"
  },
  {
    id: "q-2",
    text: "Are there any specific constraints or limitations?",
    answer: "",
    isRelevant: null,
    category: "Constraints"
  },
  {
    id: "q-3",
    text: "What is the target audience?",
    answer: "",
    isRelevant: null,
    category: "Audience"
  },
];

export const sampleFinalPrompt = `
Task: Generate a compelling narrative.
Persona: A seasoned storyteller.
Conditions: The story must be engaging and concise.
Instructions: Craft a narrative that captivates the reader from start to finish.
`;

export const primaryToggles: Toggle[] = [
  { 
    id: "video", 
    label: "Video Creation",
    definition: "This reinforces clarity for video production by specifying format, style, length, resolution, and key editing elements while preserving the prompt's original structure and coherence.",
    prompt: "You are an AI that refines prompts for video production. The prompt is strong, so only introduce minimal changes to specify the desired format or style (e.g., live action, animation), include clear length or resolution guidelines, and address key editing or post-production requirements. Retain the original focus and structure while adding these essential video-related details."
  },
  { 
    id: "image", 
    label: "Image Creating",
    definition: "This reinforces clarity for image generation by specifying style, resolution, and content guidelines while preserving the original prompt's coherence and structure.",
    prompt: "You are an AI that refines prompts for generating images. The existing prompt is already solid; please make minimal adjustments to specify the desired visual style or medium, clarify necessary resolution or aspect ratio, and note any disclaimers for sensitive or copyrighted content. Keep the overall structure intact, focusing solely on these new image-related details."
  },
  { 
    id: "coding", 
    label: "Coding",
    definition: "This reinforces step-by-step optimization for coding prompts by confirming the target language and environment, encouraging iterative testing and debugging, and ensuring a quick self-audit for syntax or logical issues while maintaining the original structure and clarity.",
    prompt: "You are an AI with expertise in optimizing coding prompts. The original prompt is already thorough. Please revise it slightly to confirm the target language and environment, include a brief instruction for testing and debugging in an iterative loop, and encourage a quick self-audit of the code for syntax or logical issues. Maintain the rest of the prompt's structure, focusing only on these fine-tuning elements."
  },
  { 
    id: "copilot", 
    label: "Copilot",
    definition: "This reinforces an iterative, back-and-forth workflow by adapting prompts for continuous collaboration, tracking updates as \"memory,\" and inviting refinement to ensure a dynamic, copilot-style problem-solving approach while preserving the prompt's coherence.",
    prompt: "You are an AI that adapts prompts to a continuous, \"copilot-style\" context. The existing prompt is nearly perfect; simply adjust it to encourage iterative back-and-forth steps rather than a one-off answer, add a note about tracking updates or changes as a \"memory,\" and invite the user (or the AI) to refine each answer at least once for a truly collaborative workflow. Keep the original prompt's strong structure and coherence intact, adding only these new copilot elements."
  }
];

export const secondaryToggles: Toggle[] = [
  { 
    id: "token", 
    label: "Token Saver",
    definition: "This reinforces token efficiency by ensuring concise, direct responses, minimizing unnecessary detail, dynamically adjusting reasoning depth, and maintaining clarity while reducing computational cost without compromising accuracy.",
    prompt: "You are an AI that revises prompts to prioritize token efficiency and minimize computational cost based on the four strategic pillars. From the Master Prompt just created, produce a refined version that generates concise, direct responses without unnecessary detail or verbosity. Ensure code snippets remain minimal and optimized, using compressed formats (like bullet points or short paragraphs) wherever possible. Limit disclaimers, self-references, or hedging language unless strictly required. Dynamically adjust reasoning depth to the importance of the query, avoiding lengthy step-by-step explanations if a direct answer suffices. For multiple-choice or list-based tasks, group responses to prevent excessive token generation. The final output should balance completeness, accuracy, and cost-effectiveness, leveraging pre-trained knowledge over verbose reasoning while preserving clarity and correctness."
  },
  { 
    id: "strict", 
    label: "Strict Response",
    definition: "This reinforces precise formatting by explicitly enforcing structure, instructing AI to verify output integrity, and, when necessary, providing simple examples, all while keeping the prompt's content and style intact.",
    prompt: "You are an AI that specializes in enforcing precise formats. The prompt you're about to revise is already excellent, so only make minimal changes to explicitly reinforce the required output format, instruct the AI to verify that it hasn't broken the specified structure, and, if appropriate, provide a simple example illustrating correct formatting. Do not alter the prompt's main content or style; just ensure strict-formatting instructions are crystal clear."
  },
  { 
    id: "creative", 
    label: "Creative",
    definition: "This reinforces creative depth by encouraging variety in tone and style, inviting multiple viewpoints or drafts, and ensuring self-review for consistency, engagement, and coherence without altering the original creative direction.",
    prompt: "You are an AI that refines prompts for creative writing or ideation. The original prompt is already strong; simply tweak it to emphasize variety in tone or style, possibly request multiple viewpoints or drafts, and invite a short self-review for consistency, plot holes, or stylistic mismatches. Retain the core creative direction while adding these gentle enhancements to ensure the final output can engage diverse audiences and maintain narrative coherence."
  },
  { 
    id: "reasoning", 
    label: "Complex Reasoning",
    definition: "This reinforces advanced critical thinking by urging the AI to explore multiple perspectives, identify assumptions, and structure complex logic while maintaining the prompt's original tone and clarity.",
    prompt: "You are an AI that handles multi-layered, abstract problems. The existing prompt is strong; please refine it to ensure thorough examination of diverse angles, potential hidden assumptions, and any conflicting viewpoints. Integrate a methodical breakdown of complex concepts referencing known logical frameworks, while preserving the prompt's original tone and focus."
  }
];
