import { Question, Variable } from '../types.ts';

/**
 * Generates context-specific questions based on the template pillars
 * @param promptText The original prompt text
 * @param template The template with pillars to use for generating questions
 * @returns An array of questions organized by pillar categories
 */
export function generateContextQuestionsForPrompt(
  promptText: string,
  template: any = null
): Question[] {
  // Validate template structure before proceeding
  if (!template || !template.pillars || !Array.isArray(template.pillars) || template.pillars.length === 0) {
    console.log("No valid template found, using default questions");
    return generateDefaultQuestions(promptText);
  }

  const questions: Question[] = [];
  let questionIdCounter = 1;

  console.log(`Generating questions based on ${template.pillars.length} pillars from template: ${template.name}`);
  
  // Generate 3-4 questions per pillar based on the pillar description
  template.pillars.forEach((pillar: any) => {
    if (!pillar || !pillar.title || !pillar.description) {
      console.log("Skipping invalid pillar", pillar);
      return;
    }

    const pillarTitle = pillar.title;
    const pillarDescription = pillar.description;
    
    console.log(`Generating questions for pillar: ${pillarTitle}`);
    
    // Generate questions specific to this pillar using its description for context
    const pillarQuestions = generateQuestionsForPillar(
      promptText,
      pillarTitle,
      pillarDescription,
      questionIdCounter
    );
    
    console.log(`Generated ${pillarQuestions.length} questions for pillar ${pillarTitle}`);
    
    questions.push(...pillarQuestions);
    questionIdCounter += pillarQuestions.length;
  });

  // If we couldn't generate any questions from pillars, fall back to defaults
  if (questions.length === 0) {
    console.log("Failed to generate pillar-based questions, using defaults");
    return generateDefaultQuestions(promptText);
  }

  return questions;
}

/**
 * Generate questions for a specific pillar based on its description
 */
function generateQuestionsForPillar(
  promptText: string,
  pillarTitle: string,
  pillarDescription: string,
  startId: number
): Question[] {
  // Extract key focus areas from the pillar description
  const focusAreas = extractFocusAreasFromDescription(pillarDescription);
  console.log(`Extracted focus areas for ${pillarTitle}:`, focusAreas);
  
  // Generate 3-4 questions based on the pillar focus
  const questions: Question[] = [];
  const questionsToGenerate = Math.min(Math.max(focusAreas.length + 1, 3), 4);
  
  // Basic question templates that can be adapted for different pillars
  const questionTemplates = {
    "Task": [
      "What is the main {focus} you want to achieve?",
      "How would you define the scope of the {focus}?",
      "What are the key deliverables for this {focus}?",
      "What does success look like for this {focus}?"
    ],
    "Persona": [
      "Who is the target audience for this {focus}?",
      "What role or perspective should be adopted for the {focus}?",
      "What level of expertise should be demonstrated in the {focus}?",
      "How would you describe the ideal voice for this {focus}?"
    ],
    "Conditions": [
      "What tone or style should be used for the {focus}?",
      "Are there any specific constraints for the {focus}?",
      "What is the desired length or format for the {focus}?",
      "What mood or emotional impact should the {focus} have?"
    ],
    "Instructions": [
      "What specific steps or processes should be included in the {focus}?",
      "How should the {focus} be structured or organized?",
      "What methodology should be used for the {focus}?",
      "What guidance is needed for implementing the {focus}?"
    ]
  };
  
  // Choose the right question template category based on pillar title
  const templateCategory = Object.keys(questionTemplates).find(
    category => pillarTitle.toLowerCase().includes(category.toLowerCase()) || 
               category.toLowerCase().includes(pillarTitle.toLowerCase())
  ) || "Task";
  
  const selectedTemplates = questionTemplates[templateCategory];
  
  for (let i = 0; i < questionsToGenerate; i++) {
    const focus = i < focusAreas.length ? focusAreas[i] : pillarTitle.toLowerCase();
    const template = selectedTemplates[i % selectedTemplates.length];
    const text = template.replace('{focus}', focus);
    
    questions.push({
      id: `q-${startId + i}`,
      text,
      answer: "",
      isRelevant: null,
      category: pillarTitle
    });
  }
  
  return questions;
}

/**
 * Extract key focus areas from a pillar description
 */
function extractFocusAreasFromDescription(description: string): string[] {
  // Split description into sentences
  const sentences = description.split(/[.!?]/).filter(s => s.trim().length > 0);
  
  // Extract key nouns and phrases
  const focusAreas: string[] = [];
  
  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);
    
    // Look for important words by avoiding common words/stopwords
    const stopwords = ['the', 'a', 'an', 'is', 'are', 'and', 'or', 'to', 'that', 'this', 'in', 'for', 'with', 'by', 'on', 'as', 'it', 'be', 'not', 'of'];
    const keyWords = words.filter(word => 
      word.length > 3 && !stopwords.includes(word.toLowerCase())
    );
    
    if (keyWords.length > 0) {
      // Use up to 3 consecutive words as a focus area
      const focusPhrase = keyWords.slice(0, Math.min(3, keyWords.length)).join(' ').toLowerCase();
      if (focusPhrase && !focusAreas.includes(focusPhrase)) {
        focusAreas.push(focusPhrase);
      }
    }
  });
  
  return focusAreas.slice(0, 4); // Return up to 4 focus areas
}

function generateContextualVariablesForPrompt(
  promptText: string,
  template: any = null,
  imageAnalysis: any = null,
  smartContext: any = null
): Variable[] {
  console.log("Generating contextual variables with enhanced intent detection");

  const variables: Variable[] = [];
  let variableCounter = 1;

  // Core Task Variables (always include these)
  const coreVariables = [
    { name: "Format/Medium", value: "", category: "Core Task" },
    { name: "Output Type", value: "", category: "Core Task" },
    { name: "Main Subject", value: "", category: "Core Task" }
  ];

  // Technical Variables
  const technicalVariables = [
    { name: "Dimensions/Size", value: "", category: "Technical" },
    { name: "Resolution/Quality", value: "", category: "Technical" },
    { name: "Technical Constraints", value: "", category: "Technical" }
  ];

  // Style Variables
  const styleVariables = [
    { name: "Style/Aesthetic", value: "", category: "Style" },
    { name: "Tone/Mood", value: "", category: "Style" },
    { name: "Color Scheme", value: "", category: "Style" }
  ];

  // Context Variables
  const contextVariables = [
    { name: "Target Audience", value: "", category: "Context" },
    { name: "Purpose/Intent", value: "", category: "Context" },
    { name: "Usage Context", value: "", category: "Context" }
  ];

  // Combine all base variables
  const allBaseVariables = [
    ...coreVariables,
    ...technicalVariables,
    ...styleVariables,
    ...contextVariables
  ];

  // Add base variables with proper IDs and codes
  variables.push(...allBaseVariables.map((v, i) => ({
    id: `v-${variableCounter + i}`,
    name: v.name,
    value: v.value,
    isRelevant: true,
    category: v.category,
    code: `VAR_${variableCounter + i}`
  })));
  
  variableCounter += allBaseVariables.length;

  // Extract and pre-fill values from available context
  if (imageAnalysis) {
    prefillFromImageAnalysis(variables, imageAnalysis);
  }

  if (smartContext?.context) {
    prefillFromSmartContext(variables, smartContext.context);
  }

  // Extract explicit values from prompt text
  prefillFromPromptText(variables, promptText);

  return variables;
}

function prefillFromImageAnalysis(variables: Variable[], imageAnalysis: any) {
  if (imageAnalysis.style?.colors?.length > 0) {
    const color = imageAnalysis.style.colors[0];
    const colorVar = variables.find(v => v.name === "Color Scheme");
    if (colorVar) {
      colorVar.value = color;
    }
  }

  if (imageAnalysis.subjects?.length > 0) {
    const subject = imageAnalysis.subjects[0];
    const subjectVar = variables.find(v => v.name === "Main Subject");
    if (subjectVar) {
      subjectVar.value = subject;
    }
  }
}

function prefillFromSmartContext(variables: Variable[], context: string) {
  const keyValuePattern = /([a-zA-Z\s]+):\s*([^,.]+)/gi;
  let match;

  while ((match = keyValuePattern.exec(context)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();

    const variable = variables.find(v => v.name === name);
    if (variable) {
      variable.value = value;
    }
  }
}

function prefillFromPromptText(variables: Variable[], promptText: string) {
  const patterns = [
    /(?:with|has|in|of)\s+(?:a|an|the)?\s*([a-zA-Z\s]+)\s+([a-zA-Z\s]+)/gi,
    /(?:style|type|kind|color|size|format)\s+(?:of|is|should be)?\s*([a-zA-Z\s]+)/gi,
    /(?:doing|performing|making|creating)\s+(?:a|an|the)?\s*([a-zA-Z\s]+)/gi,
    /(?:for|targeting|aimed at)\s+(?:a|an|the)?\s*([a-zA-Z\s]+)/gi
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(promptText)) !== null) {
      const name = match[1]?.trim();
      const value = match[2]?.trim();

      if (name && value) {
        const variable = variables.find(v => v.name === name);
        if (variable) {
          variable.value = value;
        }
      }
    }
  });
}

// Export the functions
export { generateContextualVariablesForPrompt };
