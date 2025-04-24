import { Question, Variable } from '../types.ts';

export function generateContextQuestionsForPrompt(
  promptText: string,
  template: any = null,
  smartContext: any = null,
  imageAnalysis: any = null
): Question[] {
  console.log("Generating context-specific questions based on template pillars");
  
  const questions: Question[] = [];
  
  if (template?.pillars?.length > 0) {
    // Calculate max questions per pillar to ensure we don't exceed total
    const maxQuestionsPerPillar = Math.min(3, Math.ceil(9 / template.pillars.length));
    
    template.pillars.forEach((pillar: any, index: number) => {
      if (pillar && pillar.title) {
        // Generate base question for the pillar
        const baseQuestion: Question = {
          id: `q-${pillar.title.toLowerCase()}-1`,
          text: `What are your specific requirements for ${pillar.title.toLowerCase()}?`,
          answer: "",
          isRelevant: true,
          category: pillar.title,
          contextSource: undefined
        };

        // Add the base question
        questions.push(baseQuestion);

        // Add up to 2 more context-gathering questions if needed
        if (maxQuestionsPerPillar > 1) {
          questions.push({
            id: `q-${pillar.title.toLowerCase()}-2`,
            text: `What are your goals for ${pillar.title.toLowerCase()}?`,
            answer: "",
            isRelevant: true,
            category: pillar.title,
            contextSource: undefined
          });
        }

        if (maxQuestionsPerPillar > 2) {
          questions.push({
            id: `q-${pillar.title.toLowerCase()}-3`,
            text: `Are there any specific constraints or requirements for ${pillar.title.toLowerCase()}?`,
            answer: "",
            isRelevant: true,
            category: pillar.title,
            contextSource: undefined
          });
        }
      }
    });
  }

  // If we have image analysis, use it to pre-fill relevant answers with detailed information
  if (imageAnalysis) {
    questions.forEach(question => {
      const relevantImageInfo = findDetailedRelevantImageInfo(question, imageAnalysis);
      if (relevantImageInfo) {
        question.answer = relevantImageInfo;
        question.contextSource = 'image';
      }
    });
  }

  return questions;
}

// Enhanced function to find detailed relevant image analysis information for a question
function findDetailedRelevantImageInfo(question: Question, imageAnalysis: any): string | null {
  const questionText = question.text.toLowerCase();
  const category = question.category.toLowerCase();

  // Map of question keywords to image analysis fields with more comprehensive extraction
  const analysisMapping: { [key: string]: {fields: string[], format: (data: any) => string} } = {
    style: {
      fields: ['style', 'artisticStyle', 'aesthetic', 'description'],
      format: (data) => {
        const elements = [];
        if (data.style?.description) elements.push(`Style: ${data.style.description}`);
        if (data.artisticStyle) elements.push(`Artistic style: ${data.artisticStyle}`);
        if (data.aesthetic) elements.push(`Aesthetic: ${data.aesthetic}`);
        if (data.style?.elements) elements.push(`Style elements: ${data.style.elements.join(', ')}`);
        if (data.description) elements.push(`Visual description: ${data.description}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    color: {
      fields: ['colors', 'palette', 'tones', 'style.colors'],
      format: (data) => {
        const elements = [];
        if (data.style?.colors && Array.isArray(data.style.colors)) {
          elements.push(`Color palette includes: ${data.style.colors.join(', ')}`);
        }
        if (data.colors && Array.isArray(data.colors)) {
          elements.push(`Colors present: ${data.colors.join(', ')}`);
        }
        if (data.palette) elements.push(`Color scheme: ${data.palette}`);
        if (data.style?.colorProfile) elements.push(`Color profile: ${data.style.colorProfile}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    composition: {
      fields: ['composition', 'layout', 'arrangement', 'structure'],
      format: (data) => {
        const elements = [];
        if (data.composition) elements.push(`Composition: ${data.composition}`);
        if (data.layout) elements.push(`Layout: ${data.layout}`);
        if (data.structure) elements.push(`Structure: ${data.structure}`);
        if (data.arrangement) elements.push(`Arrangement: ${data.arrangement}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    subject: {
      fields: ['subject', 'mainSubject', 'subjects', 'objects', 'description', 'mainElements'],
      format: (data) => {
        const elements = [];
        if (data.subject) elements.push(`Subject: ${data.subject}`);
        if (data.mainSubject) elements.push(`Main subject: ${data.mainSubject}`);
        if (data.subjects && Array.isArray(data.subjects)) {
          elements.push(`Subjects identified: ${data.subjects.join(', ')}`);
        }
        if (data.objects && Array.isArray(data.objects)) {
          elements.push(`Objects present: ${data.objects.join(', ')}`);
        }
        if (data.mainElements && Array.isArray(data.mainElements)) {
          elements.push(`Key elements: ${data.mainElements.join(', ')}`);
        }
        if (elements.length === 0 && data.description) {
          elements.push(`Visual description: ${data.description}`);
        }
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    mood: {
      fields: ['mood', 'atmosphere', 'feeling', 'style.mood'],
      format: (data) => {
        const elements = [];
        if (data.mood) elements.push(`Mood: ${data.mood}`);
        if (data.style?.mood) elements.push(`Style mood: ${data.style.mood}`);
        if (data.atmosphere) elements.push(`Atmosphere: ${data.atmosphere}`);
        if (data.feeling) elements.push(`Feeling: ${data.feeling}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    },
    purpose: {
      fields: ['purpose', 'intent', 'goal', 'usage'],
      format: (data) => {
        const elements = [];
        if (data.purpose) elements.push(`Purpose: ${data.purpose}`);
        if (data.intent) elements.push(`Intent: ${data.intent}`);
        if (data.usage) elements.push(`Usage context: ${data.usage}`);
        
        return elements.length ? elements.join('. ') : null;
      }
    }
  };

  // First try to match by category
  for (const [key, mapping] of Object.entries(analysisMapping)) {
    if (category.includes(key) || mapping.fields.some(field => category.includes(field))) {
      const formattedInfo = mapping.format(imageAnalysis);
      if (formattedInfo) {
        return formattedInfo;
      }
    }
  }
  
  // Then try to match by question text
  for (const [key, mapping] of Object.entries(analysisMapping)) {
    if (questionText.includes(key) || mapping.fields.some(field => questionText.includes(field))) {
      const formattedInfo = mapping.format(imageAnalysis);
      if (formattedInfo) {
        return formattedInfo;
      }
    }
  }

  // If no specific match found but we have a general description, use that for content-related questions
  if ((questionText.includes('content') || 
       questionText.includes('what') || 
       questionText.includes('describe') || 
       questionText.includes('show')) && 
       imageAnalysis.description) {
    return `Based on image analysis: ${imageAnalysis.description}`;
  }

  // Comprehensive fallback for context questions
  if (imageAnalysis.description || imageAnalysis.style || imageAnalysis.subject) {
    const elements = [];
    if (imageAnalysis.description) elements.push(imageAnalysis.description);
    if (imageAnalysis.style?.description) elements.push(`Style: ${imageAnalysis.style.description}`);
    if (imageAnalysis.subject) elements.push(`Subject: ${imageAnalysis.subject}`);
    
    if (elements.length > 0) {
      return `From image analysis: ${elements.join('. ')}`;
    }
  }

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
