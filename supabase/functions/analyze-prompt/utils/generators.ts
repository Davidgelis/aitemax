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
  // Default questions if no template provided or invalid template
  if (!template || !template.pillars || !Array.isArray(template.pillars) || template.pillars.length === 0) {
    return generateDefaultQuestions(promptText);
  }

  const questions: Question[] = [];
  let questionIdCounter = 1;

  // Generate 2-4 questions per pillar based on the pillar description
  template.pillars.forEach((pillar: any) => {
    if (!pillar || !pillar.title || !pillar.description) return;

    const pillarTitle = pillar.title;
    const pillarDescription = pillar.description;
    
    // Generate questions specific to this pillar using its description for context
    const pillarQuestions = generateQuestionsForPillar(
      promptText,
      pillarTitle,
      pillarDescription,
      questionIdCounter
    );
    
    questions.push(...pillarQuestions);
    questionIdCounter += pillarQuestions.length;
  });

  // If we couldn't generate any questions from pillars, fall back to defaults
  if (questions.length === 0) {
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
  
  // Generate 2-4 questions based on the pillar focus
  const questions: Question[] = [];
  const questionsToGenerate = Math.min(Math.max(focusAreas.length, 2), 4);
  
  // Basic question templates that can be adapted for different pillars
  const questionTemplates = [
    "What is the main {focus} you want to address?",
    "Could you describe the {focus} in more detail?",
    "What specific aspects of {focus} are most important?",
    "What are your expectations regarding {focus}?",
    "How would you like the {focus} to be handled?",
    "What are the key considerations for {focus}?",
    "What outcome do you expect related to {focus}?",
    "How should {focus} be incorporated?"
  ];
  
  // Use focus areas to create specific questions
  for (let i = 0; i < questionsToGenerate; i++) {
    // If we have a focus area, use it; otherwise use a generic approach
    const focus = i < focusAreas.length ? focusAreas[i] : pillarTitle.toLowerCase();
    
    // Get a question template and replace the focus placeholder
    const template = questionTemplates[i % questionTemplates.length];
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
    const stopwords = ['the', 'a', 'an', 'is', 'are', 'and', 'or', 'to', 'that', 'this', 'in', 'for', 'with', 'by'];
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

/**
 * Generate default questions when no template is available
 */
function generateDefaultQuestions(promptText: string): Question[] {
  const questions: Question[] = [
    {
      id: "q-1",
      text: "What is the main objective or goal you want to achieve?",
      answer: "",
      isRelevant: null,
      category: "Task"
    },
    {
      id: "q-2",
      text: "Who is the intended audience for this content?",
      answer: "",
      isRelevant: null,
      category: "Persona"
    },
    {
      id: "q-3",
      text: "What tone or style would you prefer for the output?",
      answer: "",
      isRelevant: null,
      category: "Conditions"
    },
    {
      id: "q-4",
      text: "Are there any specific examples or references you'd like to include?",
      answer: "",
      isRelevant: null,
      category: "Instructions"
    },
    {
      id: "q-5",
      text: "What level of detail or length do you want for the output?",
      answer: "",
      isRelevant: null,
      category: "Conditions"
    },
    {
      id: "q-6",
      text: "Are there any specific topics or aspects you want to emphasize?",
      answer: "",
      isRelevant: null,
      category: "Task"
    }
  ];
  
  return questions;
}

/**
 * Generates contextual variables for a prompt with improved organization
 */
export function generateContextualVariablesForPrompt(
  promptText: string,
  template: any = null
): Variable[] {
  // Default variables if no template provided or invalid template
  if (!template || !template.pillars || !Array.isArray(template.pillars) || template.pillars.length === 0) {
    return generateDefaultVariables();
  }
  
  const variables: Variable[] = [];
  let variableCounter = 1;
  
  // Generate 1-2 variables per pillar based on the pillar description
  template.pillars.forEach((pillar: any) => {
    if (!pillar || !pillar.title || !pillar.description) return;
    
    const pillarTitle = pillar.title;
    const pillarDescription = pillar.description;
    
    // Generate variables specific to this pillar
    const pillarVariables = generateVariablesForPillar(
      promptText,
      pillarTitle,
      pillarDescription,
      variableCounter
    );
    
    variables.push(...pillarVariables);
    variableCounter += pillarVariables.length;
  });
  
  // If we couldn't generate any variables from pillars, fall back to defaults
  if (variables.length === 0) {
    return generateDefaultVariables();
  }
  
  return variables;
}

/**
 * Generate variables for a specific pillar
 */
function generateVariablesForPillar(
  promptText: string,
  pillarTitle: string,
  pillarDescription: string,
  startId: number
): Variable[] {
  // Determine key variable types based on the pillar
  const variableTypes = determineVariableTypesForPillar(pillarTitle, pillarDescription);
  
  const variables: Variable[] = [];
  
  // Generate 1-2 variables per pillar
  const variablesToGenerate = Math.min(2, variableTypes.length);
  
  for (let i = 0; i < variablesToGenerate; i++) {
    const variableType = variableTypes[i];
    
    variables.push({
      id: `v-${startId + i}`,
      name: variableType,
      value: "",
      isRelevant: null,
      category: pillarTitle,
      code: `VAR_${startId + i}`
    });
  }
  
  return variables;
}

/**
 * Determine variable types for a specific pillar
 */
function determineVariableTypesForPillar(pillarTitle: string, pillarDescription: string): string[] {
  // Define common variable types by pillar category
  const commonVariablesByPillar: {[key: string]: string[]} = {
    "Task": ["Objective", "Goal", "Task Type", "Deliverable", "Format"],
    "Persona": ["Audience", "Character", "Role", "Expertise Level", "Perspective"],
    "Conditions": ["Tone", "Style", "Length", "Constraints", "Requirements"],
    "Instructions": ["Guidance", "Steps", "Process", "Methodology", "Approach"]
  };
  
  // Get variables for this pillar or use generic ones
  const pillarLower = pillarTitle.toLowerCase();
  
  // Find the closest matching pillar category
  let bestMatch = "";
  let bestScore = 0;
  
  Object.keys(commonVariablesByPillar).forEach(key => {
    const keyLower = key.toLowerCase();
    if (pillarLower.includes(keyLower) || keyLower.includes(pillarLower)) {
      const score = Math.max(pillarLower.length, keyLower.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = key;
      }
    }
  });
  
  // Use the best matching pillar variables or a generic set
  const variableTypes = bestMatch ? 
    commonVariablesByPillar[bestMatch] : 
    ["Input", "Output Format", "Context"];
  
  return variableTypes;
}

/**
 * Generate default variables when no template is available
 */
function generateDefaultVariables(): Variable[] {
  const variables: Variable[] = [
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
    }
  ];
  
  return variables;
}
