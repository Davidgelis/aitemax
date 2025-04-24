
import { Question, Variable } from '../types.ts';

export function generateContextQuestionsForPrompt(
  promptText: string,
  template: any = null,
  smartContext: any = null,
  imageAnalysis: any = null
): Question[] {
  console.log("Generating comprehensive context questions based on user intent and template pillars");
  
  const questions: Question[] = [];
  
  // Step 1: Generate a complete set of questions based on user intent and template pillars
  if (template?.pillars?.length > 0) {
    // Calculate max questions per pillar to ensure good coverage
    const maxQuestionsPerPillar = Math.min(4, Math.ceil(12 / template.pillars.length));
    
    template.pillars.forEach((pillar: any, index: number) => {
      if (pillar && pillar.title) {
        const pillarQuestions = generateQuestionsForPillar(promptText, pillar, maxQuestionsPerPillar);
        questions.push(...pillarQuestions);
      }
    });
  } else {
    // If no template pillars, generate generic context questions
    const genericQuestions = generateGenericContextQuestions(promptText);
    questions.push(...genericQuestions);
  }

  // Step 2: Only after generating all questions, fill relevant ones with image analysis data
  if (imageAnalysis) {
    console.log("Filling relevant questions with detailed image analysis data", {
      imageAnalysisFields: Object.keys(imageAnalysis),
      questionsBeforeFilling: questions.length
    });
    
    questions.forEach(question => {
      const relevantImageInfo = findDetailedRelevantImageInfo(question, imageAnalysis);
      if (relevantImageInfo) {
        question.answer = relevantImageInfo;
        question.contextSource = 'image';
        console.log(`Prefilled question "${question.text.substring(0, 30)}..." with image analysis data`);
      }
    });
    
    console.log(`After filling: ${questions.filter(q => q.answer).length} questions have prefilled answers`);
  }

  console.log(`Generated ${questions.length} total questions, ${questions.filter(q => q.answer).length} with prefilled answers`);
  return questions;
}

function generateQuestionsForPillar(promptText: string, pillar: any, maxQuestions: number): Question[] {
  const questions: Question[] = [];
  const pillarTitle = pillar.title.toLowerCase();
  const userIntentKeywords = extractKeywords(promptText);

  // Base question templates based on pillar type
  const questionTemplates: { [key: string]: string[] } = {
    style: [
      "What artistic style or aesthetic are you looking to achieve?",
      "Are there specific visual elements or techniques you want to incorporate?",
      "What mood or atmosphere should the final result convey?",
      "What level of stylization or realism do you prefer?"
    ],
    technical: [
      "What are your specific requirements for dimensions and resolution?",
      "Are there any technical constraints or format requirements?",
      "What level of detail or quality are you aiming for?",
      "What platform or medium will this be used for?"
    ],
    content: [
      "What are the main elements or subjects that should be included?",
      "How should these elements be arranged or composed?",
      "Are there any specific details or features that must be emphasized?",
      "What narrative or story should the content convey?"
    ],
    purpose: [
      "What is the intended use or purpose of this creation?",
      "Who is your target audience?",
      "What message or feeling should it communicate?",
      "What action do you want viewers to take after seeing this?"
    ],
    color: [
      "What color palette or scheme would you like to use?",
      "Are there specific colors that must be included or avoided?",
      "What kind of color harmony are you aiming for?",
      "How should color be used to emphasize important elements?"
    ],
    composition: [
      "How should the elements be arranged in the space?",
      "What kind of visual hierarchy do you want to establish?",
      "Are there specific compositional techniques you'd like to use?",
      "What focal point or emphasis do you want in the composition?"
    ],
    context: [
      "In what context will this creation be used or displayed?",
      "Are there any cultural or regional considerations to keep in mind?",
      "What is the intended viewing environment for this?",
      "Are there any broader themes or concepts this should connect to?"
    ]
  };

  // Customize questions based on user intent keywords
  let relevantQuestions: string[] = [];
  
  // Try to match pillar title with question templates
  for (const [key, questions] of Object.entries(questionTemplates)) {
    if (pillarTitle.includes(key) || pillar.description.toLowerCase().includes(key)) {
      relevantQuestions = questions.map(q => customizeQuestionWithIntent(q, userIntentKeywords));
      break;
    }
  }

  // If no specific match found, use generic questions
  if (relevantQuestions.length === 0) {
    relevantQuestions = [
      `What are your specific requirements for ${pillarTitle}?`,
      `What are your goals regarding ${pillarTitle}?`,
      `Are there any particular preferences or constraints for ${pillarTitle}?`,
      `How should ${pillarTitle} contribute to the overall output?`
    ].map(q => customizeQuestionWithIntent(q, userIntentKeywords));
  }

  // Add questions up to the maximum allowed
  for (let i = 0; i < Math.min(maxQuestions, relevantQuestions.length); i++) {
    questions.push({
      id: `q-${pillarTitle}-${i + 1}`,
      text: relevantQuestions[i],
      answer: "",
      isRelevant: true,
      category: pillar.title,
      contextSource: undefined
    });
  }

  return questions;
}

// Extract keywords from prompt text to customize questions
function extractKeywords(promptText: string): string[] {
  if (!promptText) return [];
  
  // Extract nouns and important words
  const words = promptText.toLowerCase().split(/\s+/);
  const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'for', 'with', 'in', 'on', 'at', 'to', 'of'];
  
  return words
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 2)
    .slice(0, 5); // Take top 5 keywords
}

// Customize question with user intent keywords
function customizeQuestionWithIntent(question: string, keywords: string[]): string {
  if (keywords.length === 0) return question;
  
  // For the first few questions, try to incorporate keywords
  if (Math.random() > 0.5 && keywords.length > 0) {
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    if (question.includes("?")) {
      return question.replace("?", ` for your ${keyword}?`);
    }
  }
  
  return question;
}

// Generate generic context questions when no template is available
function generateGenericContextQuestions(promptText: string): Question[] {
  const questions: Question[] = [];
  const categories = [
    { name: "Style", questions: [
      "What artistic style or aesthetic are you looking to achieve?",
      "What visual style would you prefer for the output?",
      "Are there any specific design elements you want to include?"
    ]},
    { name: "Technical", questions: [
      "What dimensions or format do you need for the output?",
      "Are there any technical specifications or constraints?",
      "What level of detail or quality do you require?"
    ]},
    { name: "Content", questions: [
      "What key elements should be included in the output?",
      "How should the main subject be presented or emphasized?",
      "What details are most important for your needs?"
    ]},
    { name: "Purpose", questions: [
      "What is the intended use of this output?",
      "Who is your target audience?",
      "What message or feeling should this convey?"
    ]}
  ];
  
  const keywords = extractKeywords(promptText);
  let questionCount = 0;
  
  categories.forEach(category => {
    const categoryQuestions = category.questions.map(q => customizeQuestionWithIntent(q, keywords));
    for (let i = 0; i < Math.min(3, categoryQuestions.length); i++) {
      questions.push({
        id: `q-${category.name.toLowerCase()}-${i + 1}`,
        text: categoryQuestions[i],
        answer: "",
        isRelevant: true,
        category: category.name,
        contextSource: undefined
      });
      questionCount++;
      if (questionCount >= 12) break;
    }
  });
  
  return questions;
}

function findDetailedRelevantImageInfo(question: Question, imageAnalysis: any): string | null {
  if (!imageAnalysis) {
    console.log("No image analysis data available");
    return null;
  }
  
  const questionText = question.text.toLowerCase();
  const category = question.category.toLowerCase();
  
  console.log(`Finding image info for question category: "${category}", text: "${questionText.substring(0, 30)}..."`);

  const analysisMapping: { [key: string]: {fields: string[], format: (data: any) => string} } = {
    style: {
      fields: ['style', 'artisticStyle', 'aesthetic', 'description', 'techniques', 'influences'],
      format: (data) => {
        const elements = [];
        if (data.style?.description) elements.push(`Artistic style: ${data.style.description}`);
        if (data.style?.techniques) elements.push(`Techniques used: ${Array.isArray(data.style.techniques) ? data.style.techniques.join(', ') : data.style.techniques}`);
        if (data.style?.influences) elements.push(`Artistic influences: ${Array.isArray(data.style.influences) ? data.style.influences.join(', ') : data.style.influences}`);
        if (data.artisticStyle) elements.push(`Overall style characteristics: ${data.artisticStyle}`);
        if (data.aesthetic) elements.push(`Aesthetic qualities: ${data.aesthetic}`);
        if (data.style?.elements) elements.push(`Key style elements: ${Array.isArray(data.style.elements) ? data.style.elements.join(', ') : data.style.elements}`);
        if (data.description) elements.push(`Visual style description: ${data.description}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    color: {
      fields: ['colors', 'palette', 'tones', 'style.colors', 'colorHarmony', 'dominantColors'],
      format: (data) => {
        const elements = [];
        if (data.style?.colors && Array.isArray(data.style.colors)) {
          elements.push(`Color palette: ${data.style.colors.join(', ')}`);
        } else if (data.style?.colors) {
          elements.push(`Color palette: ${data.style.colors}`);
        }
        
        if (data.dominantColors && Array.isArray(data.dominantColors)) {
          elements.push(`Dominant colors: ${data.dominantColors.join(', ')}`);
        } else if (data.dominantColors) {
          elements.push(`Dominant colors: ${data.dominantColors}`);
        }
        
        if (data.colorHarmony) elements.push(`Color harmony: ${data.colorHarmony}`);
        if (data.palette) elements.push(`Color scheme: ${data.palette}`);
        if (data.tones) elements.push(`Tonal qualities: ${data.tones}`);
        if (data.style?.colorProfile) elements.push(`Color profile and mood: ${data.style.colorProfile}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    composition: {
      fields: ['composition', 'layout', 'arrangement', 'structure', 'visualHierarchy', 'balance'],
      format: (data) => {
        const elements = [];
        if (data.composition) elements.push(`Composition style: ${data.composition}`);
        if (data.visualHierarchy) elements.push(`Visual hierarchy: ${data.visualHierarchy}`);
        if (data.balance) elements.push(`Visual balance: ${data.balance}`);
        if (data.layout) elements.push(`Layout structure: ${data.layout}`);
        if (data.arrangement) elements.push(`Element arrangement: ${data.arrangement}`);
        if (data.structure) elements.push(`Overall structure: ${data.structure}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    technical: {
      fields: ['technical', 'quality', 'resolution', 'format', 'dimensions'],
      format: (data) => {
        const elements = [];
        if (data.technical?.quality) elements.push(`Image quality: ${data.technical.quality}`);
        if (data.technical?.resolution) elements.push(`Resolution: ${data.technical.resolution}`);
        if (data.technical?.format) elements.push(`Format: ${data.technical.format}`);
        if (data.technical?.dimensions) elements.push(`Dimensions: ${data.technical.dimensions}`);
        if (data.technical?.specifications) elements.push(`Technical specifications: ${data.technical.specifications}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    mood: {
      fields: ['mood', 'atmosphere', 'feeling', 'emotional', 'style.mood'],
      format: (data) => {
        const elements = [];
        if (data.mood) elements.push(`Overall mood: ${data.mood}`);
        if (data.atmosphere) elements.push(`Atmosphere: ${data.atmosphere}`);
        if (data.emotional?.impact) elements.push(`Emotional impact: ${data.emotional.impact}`);
        if (data.style?.mood) elements.push(`Stylistic mood: ${data.style.mood}`);
        if (data.feeling) elements.push(`Evoked feelings: ${data.feeling}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    context: {
      fields: ['context', 'usage', 'purpose', 'audience', 'cultural'],
      format: (data) => {
        const elements = [];
        if (data.context?.usage) elements.push(`Usage context: ${data.context.usage}`);
        if (data.context?.cultural) elements.push(`Cultural context: ${data.context.cultural}`);
        if (data.context?.audience) elements.push(`Target audience: ${data.context.audience}`);
        if (data.purpose) elements.push(`Intended purpose: ${data.purpose}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    content: {
      fields: ['subject', 'elements', 'objects', 'components', 'details'],
      format: (data) => {
        const elements = [];
        if (data.subject) elements.push(`Main subject: ${data.subject}`);
        if (data.elements) elements.push(`Visual elements: ${Array.isArray(data.elements) ? data.elements.join(', ') : data.elements}`);
        if (data.objects) elements.push(`Key objects: ${Array.isArray(data.objects) ? data.objects.join(', ') : data.objects}`);
        if (data.components) elements.push(`Component details: ${Array.isArray(data.components) ? data.components.join(', ') : data.components}`);
        if (data.details) elements.push(`Specific details: ${data.details}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    }
  };

  // First try to match by exact category match
  const categoryWords = category.replace(/&/g, ' ').split(/\s+/).map(w => w.trim().toLowerCase()).filter(Boolean);
  
  // Try each category word for matching
  for (const categoryWord of categoryWords) {
    console.log(`Checking category word: "${categoryWord}"`);
    for (const [key, mapping] of Object.entries(analysisMapping)) {
      if (categoryWord === key || mapping.fields.includes(categoryWord)) {
        const formattedInfo = mapping.format(imageAnalysis);
        if (formattedInfo) {
          console.log(`Found match by category word "${categoryWord}" -> "${key}"`);
          return formattedInfo;
        }
      }
    }
  }
  
  // Then try with broader category matching
  for (const [key, mapping] of Object.entries(analysisMapping)) {
    if (categoryWords.some(word => key.includes(word)) || 
        mapping.fields.some(field => categoryWords.some(word => field.includes(word)))) {
      const formattedInfo = mapping.format(imageAnalysis);
      if (formattedInfo) {
        console.log(`Found match by partial category match "${key}"`);
        return formattedInfo;
      }
    }
  }
  
  // If no matches by category, try by question text
  for (const [key, mapping] of Object.entries(analysisMapping)) {
    if (questionText.includes(key) || mapping.fields.some(field => questionText.includes(field))) {
      const formattedInfo = mapping.format(imageAnalysis);
      if (formattedInfo) {
        console.log(`Found match by question text for "${key}"`);
        return formattedInfo;
      }
    }
  }

  // Final attempt - check if we have a description field
  if (imageAnalysis.description) {
    // Only use description as fallback for certain question types
    if (questionText.includes("style") || 
        questionText.includes("look") || 
        questionText.includes("visual") || 
        questionText.includes("appear") ||
        categoryWords.includes("style") ||
        categoryWords.includes("aesthetic") ||
        categoryWords.includes("visual")) {
      console.log("Using description as fallback");
      return `Based on image analysis: ${imageAnalysis.description}`;
    }
  }

  console.log("No matching image analysis data found for this question");
  return null;
}

/**
 * Enhanced variable generation with better context awareness
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
