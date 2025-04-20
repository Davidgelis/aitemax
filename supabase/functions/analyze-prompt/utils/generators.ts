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
  console.log("Generating questions strictly based on template pillars");
  
  if (!template || !template.pillars || !Array.isArray(template.pillars) || template.pillars.length === 0) {
    console.log("No valid template found, using default questions");
    return generateDefaultQuestions(promptText, imageAnalysis);
  }

  const questions: Question[] = [];
  let questionIdCounter = 1;

  console.log(`Generating questions based on ${template.pillars.length} pillars from template: ${template.name}`);
  
  // Generate questions ONLY based on the template pillars
  template.pillars.forEach((pillar: any) => {
    if (!pillar || !pillar.title || !pillar.description) {
      console.log("Skipping invalid pillar", pillar);
      return;
    }

    const pillarTitle = pillar.title;
    const pillarDescription = pillar.description;
    
    console.log(`Generating questions for pillar: ${pillarTitle}`);
    
    // Generate questions for this specific pillar
    const pillarQuestions = generateQuestionsForPillar(
      promptText,
      pillarTitle,
      pillarDescription,
      questionIdCounter
    );
    
    questions.push(...pillarQuestions);
    questionIdCounter += pillarQuestions.length;
  });

  // Only pre-fill answers based on available context if we have questions
  if (questions.length > 0) {
    console.log("Prefilling questions with available context data");
    const prefilledQuestions = prefillQuestionAnswers(questions, promptText, smartContext, imageAnalysis);
    return prefilledQuestions;
  }
  
  // Special case: Check if we have image data but no template questions
  if (imageAnalysis && (!questions.length || questions.length < 2)) {
    console.log("Using image-specific questions since we have image data but no template questions");
    return generateImageSpecificQuestions(imageAnalysis);
  }
  
  // Fallback for empty questions - should never happen with valid templates
  if (questions.length === 0) {
    console.log("Warning: No questions generated from template pillars. Using fallback questions.");
    return generateDefaultQuestions(promptText, imageAnalysis);
  }

  return questions;
}

/**
 * Generate image-specific questions based on image analysis
 */
function generateImageSpecificQuestions(imageAnalysis: any): Question[] {
  console.log("Generating image-specific questions");
  const questions = [
    {
      id: "q-img-1",
      text: "What elements or objects in this image should be emphasized?",
      answer: imageAnalysis?.subjects?.join(", ") || "",
      isRelevant: true,
      category: "Image Context",
      contextSource: "image"
    },
    {
      id: "q-img-2",
      text: "What is the main subject of this image?",
      answer: imageAnalysis?.mainSubject || "",
      isRelevant: true,
      category: "Image Context",
      contextSource: "image"
    },
    {
      id: "q-img-3",
      text: "What style or aesthetic does this image represent?",
      answer: imageAnalysis?.style?.description || imageAnalysis?.artisticStyle || "",
      isRelevant: true,
      category: "Image Style",
      contextSource: "image"
    },
    {
      id: "q-img-4",
      text: "How should this image be used in the final output?",
      answer: "",
      isRelevant: true,
      category: "Image Usage"
    }
  ];
  
  return questions;
}

/**
 * Generate default questions as a fallback
 */
function generateDefaultQuestions(promptText: string, imageAnalysis: any = null): Question[] {
  console.log("Using fallback default questions");
  const defaultQuestions = [
    {
      id: "q-default-1",
      text: "What is the primary goal of this prompt?",
      answer: "",
      isRelevant: true,
      category: "Task"
    },
    {
      id: "q-default-2",
      text: "What style or tone should be used?",
      answer: "",
      isRelevant: true,
      category: "Style"
    },
    {
      id: "q-default-3",
      text: "Who is the target audience?",
      answer: "",
      isRelevant: true,
      category: "Context"
    },
    {
      id: "q-default-4",
      text: "What format should the output take?",
      answer: "",
      isRelevant: true,
      category: "Format"
    }
  ];
  
  // If we have image analysis data, add image-specific questions
  if (imageAnalysis) {
    const imageQuestions = [
      {
        id: "q-img-1",
        text: "What elements in this image should be emphasized?",
        answer: imageAnalysis?.subjects?.join(", ") || "",
        isRelevant: true,
        category: "Image",
        contextSource: "image"
      },
      {
        id: "q-img-2",
        text: "How should this image be used in the final output?",
        answer: "",
        isRelevant: true,
        category: "Image"
      }
    ];
    
    return [...defaultQuestions, ...imageQuestions];
  }
  
  return defaultQuestions;
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
  
  // Generate a maximum of 3 questions per pillar
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
      isRelevant: true, // Set these as relevant by default
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
  console.log("Prefilling question answers with available context", {
    hasSmartContext: !!smartContext?.context,
    hasImageAnalysis: !!imageAnalysis,
    imageAnalysisFields: imageAnalysis ? Object.keys(imageAnalysis).join(", ") : "none",
    questionCount: questions.length
  });
  
  return questions.map(question => {
    const q = { ...question };
    
    // Try to match question with smart context
    if (smartContext?.context) {
      const contextMatch = findContextMatch(q.text, smartContext.context);
      if (contextMatch) {
        q.answer = formatContextAnswer(contextMatch);
        q.contextSource = "smartContext";
        console.log(`Prefilled question "${q.text.substring(0, 30)}..." from smart context`);
      }
    }
    
    // Try to match with image analysis if no smart context match
    if (!q.answer && imageAnalysis) {
      const imageMatch = findImageMatch(q.text, imageAnalysis);
      if (imageMatch) {
        q.answer = formatImageAnswer(imageMatch);
        q.contextSource = "image";
        console.log(`Prefilled question "${q.text.substring(0, 30)}..." from image analysis with: "${q.answer.substring(0, 30)}..."`);
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
  if (!imageAnalysis) return null;
  
  console.log(`Finding image match for question: "${questionText.substring(0, 30)}..." with available fields: ${Object.keys(imageAnalysis).join(", ")}`);
  
  const questionLower = questionText.toLowerCase();
  
  // Check for subject/content related questions
  if (questionLower.includes('subject') || 
      questionLower.includes('about') || 
      questionLower.includes('content') ||
      questionLower.includes('element') ||
      questionLower.includes('object')) {
    if (imageAnalysis.subjects && imageAnalysis.subjects.length > 0) {
      return `The image contains: ${imageAnalysis.subjects.join(', ')}`;
    }
    if (imageAnalysis.mainSubject) {
      return imageAnalysis.mainSubject;
    }
    if (imageAnalysis.description) {
      return imageAnalysis.description;
    }
  }
  
  // Check for style/aesthetic related questions
  if (questionLower.includes('style') || 
      questionLower.includes('tone') || 
      questionLower.includes('mood') ||
      questionLower.includes('aesthetic')) {
    if (imageAnalysis.style?.description) {
      return imageAnalysis.style.description;
    }
    if (imageAnalysis.artisticStyle) {
      return imageAnalysis.artisticStyle;
    }
    if (imageAnalysis.style?.colors && imageAnalysis.style.colors.length > 0) {
      return `The image has a ${imageAnalysis.style.colors.join(', ')} color scheme`;
    }
  }
  
  // Check for format/medium related questions
  if (questionLower.includes('format') || questionLower.includes('medium')) {
    if (imageAnalysis.format) {
      return `The image is in ${imageAnalysis.format} format`;
    }
  }
  
  return null;
}

/**
 * Format image-based answer
 */
function formatImageAnswer(imageInfo: string): string {
  return imageInfo;
}

/**
 * Generates context-specific variables for prompt analysis.
 */
export function generateContextualVariablesForPrompt(
  promptText: string,
  template: any = null,
  imageAnalysis: any = null,
  smartContext: any = null,
  isSimple: boolean = false
): Variable[] {
  console.log("Generating contextual variables with enhanced intent detection", {
    promptLength: promptText?.length,
    hasTemplate: !!template,
    hasImageAnalysis: !!imageAnalysis,
    imageAnalysisFields: imageAnalysis ? Object.keys(imageAnalysis).join(", ") : "none",
    hasSmartContext: !!smartContext?.context,
    isSimplePrompt: isSimple
  });

  const variables: Variable[] = [];
  let variableCounter = 1;

  // Define core variable categories
  const variableCategories = [
    {
      name: "Core Task",
      required: true,
      vars: [
        { name: "Format/Medium", value: "" },
        { name: "Output Type", value: "" },
        { name: "Main Subject", value: "" }
      ]
    },
    {
      name: "Technical",
      required: false,
      vars: [
        { name: "Dimensions/Size", value: "" },
        { name: "Resolution/Quality", value: "" },
        { name: "Technical Constraints", value: "" }
      ]
    },
    {
      name: "Style",
      required: false,
      vars: [
        { name: "Style/Aesthetic", value: "" },
        { name: "Tone/Mood", value: "" },
        { name: "Color Scheme", value: "" }
      ]
    },
    {
      name: "Context",
      required: false,
      vars: [
        { name: "Target Audience", value: "" },
        { name: "Purpose/Intent", value: "" },
        { name: "Usage Context", value: "" }
      ]
    }
  ];

  // Generate variables ensuring at least 8 total
  variableCategories.forEach(category => {
    const categoryVars = category.vars.map((v, i) => ({
      id: `v-${variableCounter + i}`,
      name: v.name,
      value: "",
      isRelevant: category.required,
      category: category.name,
      code: `VAR_${variableCounter + i}`
    }));
    
    variables.push(...categoryVars);
    variableCounter += categoryVars.length;
  });

  // Pre-fill values only from explicit user context
  if (smartContext?.context && smartContext.usageInstructions) {
    prefillFromSmartContext(variables, smartContext.context, smartContext.usageInstructions);
  }

  // Prioritize image analysis prefilling if available
  if (imageAnalysis) {
    console.log("Prefilling variables from image analysis with fields:", Object.keys(imageAnalysis).join(", "));
    prefillFromImageAnalysis(variables, imageAnalysis);
  }

  // Extract explicit values from prompt text
  prefillFromPromptText(variables, promptText);

  // Ensure we have at least 8 variables
  while (variables.length < 8) {
    variables.push({
      id: `v-${variableCounter}`,
      name: `Variable ${variableCounter}`,
      value: "",
      isRelevant: false,
      category: "Additional",
      code: `VAR_${variableCounter}`
    });
    variableCounter++;
  }

  return variables;
}

function prefillFromImageAnalysis(variables: Variable[], analysis: any) {
  if (!analysis) return;

  console.log("Prefilling variables from image analysis with fields:", Object.keys(analysis).join(", "));
  
  // Map image analysis properties to variable names
  const mappings = [
    { analysisKey: "style.colors", varName: "Color Scheme", transform: (val: string[]) => val.join(", ") },
    { analysisKey: "subjects", varName: "Main Subject", transform: (val: string[]) => val.length > 0 ? val[0] : "" },
    { analysisKey: "style.description", varName: "Style/Aesthetic", transform: (val: string) => val },
    { analysisKey: "artisticStyle", varName: "Style/Aesthetic", transform: (val: string) => val },
    { analysisKey: "format", varName: "Format/Medium", transform: (val: string) => val },
    { analysisKey: "dimensions", varName: "Dimensions/Size", transform: (val: any) => `${val.width}x${val.height}` },
    { analysisKey: "style.mood", varName: "Tone/Mood", transform: (val: string) => val },
    { analysisKey: "mood", varName: "Tone/Mood", transform: (val: string) => val },
    { analysisKey: "quality", varName: "Resolution/Quality", transform: (val: string) => val },
    { analysisKey: "mainSubject", varName: "Main Subject", transform: (val: string) => val }
  ];
  
  mappings.forEach(mapping => {
    const variableToFill = variables.find(v => v.name === mapping.varName);
    if (!variableToFill) return;
    
    // Direct property access first for non-nested properties
    if (!mapping.analysisKey.includes('.') && analysis[mapping.analysisKey]) {
      try {
        variableToFill.value = mapping.transform(analysis[mapping.analysisKey]);
        variableToFill.contextSource = "image";
        console.log(`Prefilled "${mapping.varName}" with "${variableToFill.value}" from image analysis (direct property)`);
        return;
      } catch (error) {
        console.error(`Error transforming direct value for ${mapping.varName}:`, error);
      }
    }
    
    // Extract the value from potentially nested path
    const path = mapping.analysisKey.split('.');
    let value = analysis;
    for (const key of path) {
      if (!value) break;
      value = value[key];
    }
    
    if (value) {
      try {
        variableToFill.value = mapping.transform(value);
        variableToFill.contextSource = "image";
        console.log(`Prefilled "${mapping.varName}" with "${variableToFill.value}" from image analysis (nested path)`);
      } catch (error) {
        console.error(`Error transforming value for ${mapping.varName}:`, error);
      }
    }
  });
  
  // Special handling for additional fields
  if (analysis.description && !variables.find(v => v.name === "Main Subject")?.value) {
    const subjectVar = variables.find(v => v.name === "Main Subject");
    if (subjectVar) {
      subjectVar.value = analysis.description.split(' ').slice(0, 3).join(' ');
      subjectVar.contextSource = "image";
      console.log(`Prefilled "Main Subject" with "${subjectVar.value}" from description`);
    }
  }
  
  if (analysis.purpose) {
    const purposeVar = variables.find(v => v.name === "Purpose/Intent");
    if (purposeVar) {
      purposeVar.value = analysis.purpose;
      purposeVar.contextSource = "image";
      console.log(`Prefilled "Purpose/Intent" with "${purposeVar.value}"`);
    }
  }
}

function prefillFromSmartContext(variables: Variable[], context: string, usageInstructions: string) {
  if (!context || !usageInstructions) return;
  
  console.log("Prefilling variables from smart context");
  
  const keyValuePattern = /([a-zA-Z\s]+):\s*([^,.]+)/gi;
  let match;

  while ((match = keyValuePattern.exec(context)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();

    // Only prefill if the usage instructions mention this type of information
    if (usageInstructions.toLowerCase().includes(name.toLowerCase())) {
      const variable = variables.find(v => v.name === name);
      if (variable) {
        variable.value = value;
        variable.contextSource = "smartContext";
      }
    }
  }
}

function prefillFromPromptText(variables: Variable[], promptText: string) {
  if (!promptText) return;
  
  console.log("Prefilling variables from prompt text");
  
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
          variable.contextSource = "prompt";
        }
      }
    }
  });
}
