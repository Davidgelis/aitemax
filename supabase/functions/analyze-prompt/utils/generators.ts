import { Question, Variable } from '../types.ts';

/**
 * Generates context-specific questions based on the template pillars
 */
export function generateContextQuestionsForPrompt(
  promptText: string,
  template: any = null,
  smartContext: any = null,
  imageAnalysis: any = null
): Question[] {
  if (!template || !template.pillars || !Array.isArray(template.pillars) || template.pillars.length === 0) {
    console.log("No valid template found, using default questions");
    return generateDefaultQuestions(promptText);
  }

  const questions: Question[] = [];
  let questionIdCounter = 1;

  console.log(`Generating questions based on ${template.pillars.length} pillars from template: ${template.name}`);
  
  // Generate up to 3 questions per pillar
  template.pillars.forEach((pillar: any) => {
    if (!pillar || !pillar.title || !pillar.description) {
      console.log("Skipping invalid pillar", pillar);
      return;
    }

    const pillarTitle = pillar.title;
    const pillarDescription = pillar.description;
    
    console.log(`Generating questions for pillar: ${pillarTitle}`);
    
    // Generate up to 3 focused questions per pillar
    const pillarQuestions = generateQuestionsForPillar(
      promptText,
      pillarTitle,
      pillarDescription,
      questionIdCounter
    );
    
    questions.push(...pillarQuestions);
    questionIdCounter += pillarQuestions.length;
  });

  // Pre-fill answers based on available context
  const prefilledQuestions = prefillQuestionAnswers(questions, promptText, smartContext, imageAnalysis);

  return prefilledQuestions;
}

/**
 * Generate up to 3 focused questions for a specific pillar
 */
function generateQuestionsForPillar(
  promptText: string,
  pillarTitle: string,
  pillarDescription: string,
  startId: number
): Question[] {
  // Extract key aspects from pillar description
  const keyAspects = extractKeyAspects(pillarDescription);
  const questions: Question[] = [];
  
  // Generate a maximum of 3 questions
  const maxQuestions = Math.min(3, keyAspects.length + 1);
  
  // Question templates mapped to pillar types
  const questionTemplates = {
    "Task": [
      "What specific {aspect} needs to be achieved?",
      "How would you define the scope of the {aspect}?",
      "What are the key deliverables for the {aspect}?"
    ],
    "Persona": [
      "Who is the target audience for the {aspect}?",
      "What role should be adopted for the {aspect}?",
      "What expertise level is needed for the {aspect}?"
    ],
    "Conditions": [
      "What style should be used for the {aspect}?",
      "Are there specific constraints for the {aspect}?",
      "What is the desired format for the {aspect}?"
    ],
    "Instructions": [
      "What steps are needed for the {aspect}?",
      "How should the {aspect} be structured?",
      "What methods should be used for the {aspect}?"
    ]
  };
  
  const templateCategory = Object.keys(questionTemplates).find(
    category => pillarTitle.toLowerCase().includes(category.toLowerCase())
  ) || "Task";
  
  const templates = questionTemplates[templateCategory];
  
  for (let i = 0; i < maxQuestions; i++) {
    const aspect = keyAspects[i] || pillarTitle.toLowerCase();
    const template = templates[i % templates.length];
    questions.push({
      id: `q-${startId + i}`,
      text: template.replace('{aspect}', aspect),
      answer: "",
      isRelevant: null,
      category: pillarTitle
    });
  }
  
  return questions;
}

/**
 * Extract key aspects from a pillar description
 */
function extractKeyAspects(description: string): string[] {
  const sentences = description.split(/[.!?]/).filter(s => s.trim());
  const keyPhrases = [];
  
  const stopwords = ['the', 'a', 'an', 'is', 'are', 'and', 'or', 'to', 'that', 'this'];
  
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    const keyWords = words.filter(word => 
      word.length > 3 && !stopwords.includes(word.toLowerCase())
    );
    
    if (keyWords.length > 0) {
      const phrase = keyWords.slice(0, 2).join(' ').toLowerCase();
      if (!keyPhrases.includes(phrase)) {
        keyPhrases.push(phrase);
      }
    }
  }
  
  return keyPhrases.slice(0, 3);
}

/**
 * Pre-fill question answers based on available context
 */
function prefillQuestionAnswers(
  questions: Question[],
  promptText: string,
  smartContext: any,
  imageAnalysis: any
): Question[] {
  return questions.map(question => {
    const q = { ...question };
    
    // Try to match question with smart context
    if (smartContext?.context) {
      const contextMatch = findContextMatch(q.text, smartContext.context);
      if (contextMatch) {
        q.answer = formatContextAnswer(contextMatch);
        q.contextSource = "smartContext";
      }
    }
    
    // Try to match with image analysis if no smart context match
    if (!q.answer && imageAnalysis) {
      const imageMatch = findImageMatch(q.text, imageAnalysis);
      if (imageMatch) {
        q.answer = formatImageAnswer(imageMatch);
        q.contextSource = "image";
      }
    }
    
    return q;
  });
}

/**
 * Find matching context for a question
 */
function findContextMatch(questionText: string, context: string): string | null {
  // Convert question to keywords
  const keywords = questionText.toLowerCase()
    .replace(/[?.!]/g, '')
    .split(' ')
    .filter(word => word.length > 3);
    
  // Look for context segments that match multiple keywords
  const contextSegments = context.split(/[.!?]\s+/);
  
  for (const segment of contextSegments) {
    const segmentLower = segment.toLowerCase();
    const matchingKeywords = keywords.filter(keyword => 
      segmentLower.includes(keyword)
    );
    
    if (matchingKeywords.length >= 2) {
      return segment.trim();
    }
  }
  
  return null;
}

/**
 * Format context answer into a concise paragraph
 */
function formatContextAnswer(context: string): string {
  // Limit to ~100 words
  const words = context.split(/\s+/);
  const limitedWords = words.slice(0, 100);
  let formattedAnswer = limitedWords.join(' ');
  
  // Add ellipsis if truncated
  if (words.length > 100) {
    formattedAnswer += '...';
  }
  
  return formattedAnswer;
}

/**
 * Find matching information from image analysis
 */
function findImageMatch(questionText: string, imageAnalysis: any): string | null {
  // Implementation specific to your image analysis structure
  return null;
}

/**
 * Format image-based answer
 */
function formatImageAnswer(imageInfo: string): string {
  return `Based on image analysis: ${imageInfo}`;
}

import { Question, Variable } from '../types.ts';

/**
 * Generates context-specific variables for prompt analysis.
 */
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
