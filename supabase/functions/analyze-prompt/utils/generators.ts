
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
    ],
    "Generic": [
      "What is the purpose of the {focus}?",
      "How would you describe the ideal {focus}?",
      "What aspects of the {focus} are most important?",
      "What specific elements should be included in the {focus}?"
    ]
  };
  
  // Choose the right question template category based on pillar title
  const templateCategory = Object.keys(questionTemplates).find(
    category => pillarTitle.toLowerCase().includes(category.toLowerCase()) || 
               category.toLowerCase().includes(pillarTitle.toLowerCase())
  ) || "Generic";
  
  console.log(`Using question template category "${templateCategory}" for pillar "${pillarTitle}"`);
  
  const selectedTemplates = questionTemplates[templateCategory];
  
  // Use focus areas to create specific questions
  for (let i = 0; i < questionsToGenerate; i++) {
    // If we have a focus area, use it; otherwise use the pillar title
    const focus = i < focusAreas.length ? focusAreas[i] : pillarTitle.toLowerCase();
    
    // Get a question template and replace the focus placeholder
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
    console.log("No valid template found, using default variables");
    return generateDefaultVariables();
  }
  
  const variables: Variable[] = [];
  let variableCounter = 1;
  
  console.log(`Generating variables based on ${template.pillars.length} pillars from template: ${template.name}`);
  
  // Generate 1-2 variables per pillar based on the pillar description
  template.pillars.forEach((pillar: any) => {
    if (!pillar || !pillar.title || !pillar.description) {
      console.log("Skipping invalid pillar for variables", pillar);
      return;
    }
    
    const pillarTitle = pillar.title;
    const pillarDescription = pillar.description;
    
    console.log(`Generating variables for pillar: ${pillarTitle}`);
    
    // Generate variables specific to this pillar
    const pillarVariables = generateVariablesForPillar(
      promptText,
      pillarTitle,
      pillarDescription,
      variableCounter
    );
    
    console.log(`Generated ${pillarVariables.length} variables for pillar ${pillarTitle}`);
    
    variables.push(...pillarVariables);
    variableCounter += pillarVariables.length;
  });
  
  // If we couldn't generate any variables from pillars, fall back to defaults
  if (variables.length === 0) {
    console.log("Failed to generate pillar-based variables, using defaults");
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
  console.log(`Determined variable types for ${pillarTitle}:`, variableTypes);
  
  const variables: Variable[] = [];
  
  // Generate 1-2 variables per pillar
  const variablesToGenerate = Math.min(2, Math.max(variableTypes.length, 1));
  
  for (let i = 0; i < variablesToGenerate; i++) {
    const variableType = i < variableTypes.length ? variableTypes[i] : `${pillarTitle} Parameter`;
    
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
  
  // Use the best matching pillar variables or extract from description
  let variableTypes: string[] = [];
  
  if (bestMatch) {
    // Get variables from the matching category
    variableTypes = commonVariablesByPillar[bestMatch];
  } else {
    // Extract potential variable names from the description
    const words = pillarDescription.split(/\s+/);
    const nouns = words.filter(word => word.length > 3 && /^[A-Z][a-z]+$/.test(word));
    
    if (nouns.length > 0) {
      variableTypes = nouns.slice(0, 3);
    } else {
      variableTypes = ["Format", "Context", "Parameter"];
    }
  }
  
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
