
/**
 * Utility functions for generating questions and variables from context
 */

import { classifyGapType } from './extractors';

// Generate context-aware questions based on user prompt, template, and contexts
export const generateContextQuestionsForPrompt = (
  userPrompt: string,
  template: any,
  smartContextData: any,
  imageAnalysis: any,
  userIntent: string
) => {
  console.log("Generating intent-based questions for:", userIntent);
  
  // Default questions if we can't generate from template
  const defaultQuestions = [
    {
      id: `q-${Date.now()}-1`,
      text: "What specific details can you provide about the subject?",
      answer: "",
      isRelevant: true,
      category: "Content",
      prefillSource: null
    },
    {
      id: `q-${Date.now()}-2`,
      text: "What style or aesthetic are you looking for?",
      answer: "",
      isRelevant: true,
      category: "Style",
      prefillSource: null
    }
  ];
  
  if (!template || !Array.isArray(template.pillars) || template.pillars.length === 0) {
    console.log("No template pillars available, using default questions");
    return defaultQuestions;
  }
  
  // Extract key entities from user prompt for more targeted questions
  const extractedEntities = extractEntitiesFromPrompt(userPrompt);
  console.log("Extracted entities:", extractedEntities);
  
  // Generate questions based on template pillars and extracted entities
  const questions = [];
  
  template.pillars.forEach(pillar => {
    if (!pillar || !pillar.title) return;
    
    const pillarTitle = pillar.title;
    const pillarQuestions = generateQuestionsForPillar(
      pillarTitle, 
      extractedEntities,
      userPrompt,
      imageAnalysis,
      userIntent
    );
    
    questions.push(...pillarQuestions);
  });
  
  // If we couldn't generate any questions, use defaults
  if (questions.length === 0) {
    return defaultQuestions;
  }
  
  // Pre-fill answers from image analysis where possible
  if (imageAnalysis) {
    questions.forEach(question => {
      const relevantAnalysis = findRelevantImageAnalysisForQuestion(question, imageAnalysis, userIntent);
      if (relevantAnalysis) {
        question.answer = `Based on image analysis: ${relevantAnalysis}`;
        question.prefillSource = "image";
      }
    });
  }
  
  // Add metadata about answer expectations
  questions.forEach(question => {
    // Classify whether this should actually be a variable instead of a question
    const gapType = classifyGapType(question.text, question.category);
    question.expectedAnswerType = gapType;
  });
  
  console.log(`Generated ${questions.length} questions (${questions.filter(q => q.answer).length} prefilled)`);
  return questions;
};

// Generate contextual variables based on template and context
export const generateContextualVariablesForPrompt = (
  userPrompt: string,
  template: any,
  imageAnalysis: any,
  smartContextData: any,
  isSimple = false
) => {
  console.log("Generating contextual variables with simplicity flag:", isSimple);
  
  // Default variables if no template available
  const defaultVariables = [
    {
      id: `v-${Date.now()}-1`,
      name: "Subject",
      value: "",
      isRelevant: true,
      category: "Content",
      code: "VAR_1"
    },
    {
      id: `v-${Date.now()}-2`,
      name: "Style",
      value: "",
      isRelevant: true,
      category: "Style",
      code: "VAR_2"
    }
  ];
  
  // Early return if no template
  if (!template || !Array.isArray(template.pillars) || template.pillars.length === 0) {
    console.log("No template pillars available, using default variables");
    return defaultVariables;
  }
  
  // Extract key entities from user prompt
  const extractedEntities = extractEntitiesFromPrompt(userPrompt);
  console.log("Extracted entities for variables:", extractedEntities);

  // Generate variables based on template pillars and extracted entities
  const variables = [];
  const createdVariableNames = new Set(); // To avoid duplicates
  
  template.pillars.forEach(pillar => {
    if (!pillar || !pillar.title) return;
    
    const pillarTitle = pillar.title;
    
    // Generate pillar-specific variables
    const pillarVariables = generateVariablesForPillar(
      pillarTitle,
      extractedEntities,
      userPrompt, 
      imageAnalysis,
      isSimple
    );
    
    // Add only unique variables
    pillarVariables.forEach(variable => {
      if (!createdVariableNames.has(variable.name.toLowerCase())) {
        createdVariableNames.add(variable.name.toLowerCase());
        variables.push(variable);
      }
    });
  });
  
  // Pre-fill variables from image analysis where possible
  if (imageAnalysis) {
    variables.forEach(variable => {
      const relevantValue = findRelevantImageAnalysisForVariable(variable, imageAnalysis);
      if (relevantValue) {
        variable.value = relevantValue;
        variable.contextSource = "image";
      }
    });
  }
  
  console.log(`Generated ${variables.length} variables (${variables.filter(v => v.value).length} prefilled)`);
  
  // If we couldn't generate enough variables, combine with defaults
  if (variables.length < 2) {
    const additionalDefaults = defaultVariables.filter(
      dv => !variables.some(v => v.name.toLowerCase() === dv.name.toLowerCase())
    );
    return [...variables, ...additionalDefaults];
  }
  
  return variables;
};

// Extract key entities from the user prompt
const extractEntitiesFromPrompt = (prompt) => {
  if (!prompt) return [];
  
  // Simple entity extraction based on common patterns
  const entities = [];
  
  // Look for main subject using common patterns
  // "Create a [subject]", "Generate a [subject]", etc.
  const subjectRegexes = [
    /(?:create|generate|make|design|draw|produce)\s+(?:a|an|the)?\s*([a-z][a-z\s]+?)(?:\s+(?:with|that|which|in|for|to|of|using)|\.|$)/i,
    /(?:I want|I need|I'm looking for|I'd like|Can you)\s+(?:a|an|the)?\s*([a-z][a-z\s]+?)(?:\s+(?:with|that|which|in|for|to|of|using)|\.|$)/i
  ];
  
  let mainSubject = null;
  for (const regex of subjectRegexes) {
    const match = prompt.match(regex);
    if (match && match[1]) {
      mainSubject = match[1].trim().toLowerCase();
      entities.push({
        type: 'subject',
        value: mainSubject
      });
      break;
    }
  }
  
  // Extract colors
  const colorRegex = /\b(red|blue|green|yellow|purple|pink|orange|brown|black|white|gray|grey|teal|turquoise|gold|silver|bronze|navy|maroon|olive|violet|indigo|magenta|cyan|lavender|beige|tan|ivory|cream|crimson|aqua|burgundy)\b/ig;
  const colors = [...prompt.matchAll(colorRegex)].map(match => match[1].toLowerCase());
  colors.forEach(color => {
    entities.push({
      type: 'color',
      value: color
    });
  });
  
  // Extract sizes/dimensions
  const sizeRegex = /\b(small|medium|large|tiny|huge|giant|tall|short|big|little|mini|macro|micro|enormous|massive|petite|scaled|life-?sized)\b/ig;
  const sizes = [...prompt.matchAll(sizeRegex)].map(match => match[1].toLowerCase());
  sizes.forEach(size => {
    entities.push({
      type: 'size',
      value: size
    });
  });
  
  // Extract numeric values (potentially dimensions)
  const numericRegex = /\b(\d+(?:\.\d+)?)\s*(px|cm|mm|m|in|ft|inch(?:es)?|feet|foot|meter(?:s)?|kilometer(?:s)?|mile(?:s)?|yard(?:s)?)\b/ig;
  const dimensions = [...prompt.matchAll(numericRegex)].map(match => `${match[1]} ${match[2]}`);
  dimensions.forEach(dimension => {
    entities.push({
      type: 'dimension',
      value: dimension
    });
  });
  
  // Extract materials
  const materialRegex = /\b(wood(?:en)?|metal(?:lic)?|plastic|glass|ceramic|marble|fabric|cloth|leather|paper|cardboard|steel|iron|gold|silver|bronze|copper|aluminum|stone|granite|concrete|rubber|vinyl|silk|cotton|wool|linen|diamond|crystal)\b/ig;
  const materials = [...prompt.matchAll(materialRegex)].map(match => match[1].toLowerCase());
  materials.forEach(material => {
    entities.push({
      type: 'material',
      value: material
    });
  });
  
  return entities;
};

// Generate questions specific to a template pillar
const generateQuestionsForPillar = (
  pillarTitle,
  entities,
  userPrompt,
  imageAnalysis,
  userIntent
) => {
  const timestamp = Date.now();
  const questions = [];
  
  // Find main subject
  const mainSubject = entities.find(e => e.type === 'subject')?.value || inferMainSubject(userPrompt);
  
  // Determine what information is missing based on pillar and entities
  const missingInfo = identifyMissingInformation(pillarTitle, entities, userPrompt);
  
  switch (pillarTitle) {
    case 'Content':
    case 'Subject Matter':
      if (mainSubject) {
        if (!entities.some(e => e.type === 'color')) {
          questions.push({
            id: `q-${timestamp}-c1`,
            text: `What color scheme should the ${mainSubject} have?`,
            answer: "",
            isRelevant: true,
            category: pillarTitle,
            prefillSource: null
          });
        }
        
        if (!entities.some(e => e.type === 'size')) {
          questions.push({
            id: `q-${timestamp}-c2`,
            text: `What size or scale should the ${mainSubject} be?`,
            answer: "",
            isRelevant: true,
            category: pillarTitle,
            prefillSource: null
          });
        }
        
        // Ask about specific details of the subject
        questions.push({
          id: `q-${timestamp}-c3`,
          text: `What specific details or features should the ${mainSubject} have?`,
          answer: "",
          isRelevant: true,
          category: pillarTitle,
          prefillSource: null
        });
      } else {
        // Generic content questions if subject not identified
        questions.push({
          id: `q-${timestamp}-c4`,
          text: "What is the main subject or focus of your request?",
          answer: "",
          isRelevant: true,
          category: pillarTitle,
          prefillSource: null
        });
      }
      break;
      
    case 'Style':
    case 'Artistic Direction':
      questions.push({
        id: `q-${timestamp}-s1`,
        text: "What specific artistic style are you looking for?",
        answer: "",
        isRelevant: true,
        category: pillarTitle,
        prefillSource: null
      });
      
      questions.push({
        id: `q-${timestamp}-s2`,
        text: "Do you have any reference artists or works that illustrate the style you want?",
        answer: "",
        isRelevant: true,
        category: pillarTitle,
        prefillSource: null
      });
      break;
      
    case 'Technical':
    case 'Technical Specifications':
      questions.push({
        id: `q-${timestamp}-t1`,
        text: "What dimensions or resolution do you need?",
        answer: "",
        isRelevant: true,
        category: pillarTitle,
        prefillSource: null
      });
      
      if (isVisualRequest(userPrompt)) {
        questions.push({
          id: `q-${timestamp}-t2`,
          text: "What file format do you prefer for the final output?",
          answer: "",
          isRelevant: true,
          category: pillarTitle,
          prefillSource: null
        });
      }
      break;
      
    case 'Composition':
    case 'Layout':
      if (mainSubject) {
        questions.push({
          id: `q-${timestamp}-l1`,
          text: `Where should the ${mainSubject} be positioned in the composition?`,
          answer: "",
          isRelevant: true,
          category: pillarTitle,
          prefillSource: null
        });
      }
      
      questions.push({
        id: `q-${timestamp}-l2`,
        text: "What type of background or environment would you like?",
        answer: "",
        isRelevant: true,
        category: pillarTitle,
        prefillSource: null
      });
      break;
      
    case 'Mood':
    case 'Atmosphere':
    case 'Emotional Impact':
      questions.push({
        id: `q-${timestamp}-m1`,
        text: "What mood or atmosphere are you aiming for?",
        answer: "",
        isRelevant: true,
        category: pillarTitle,
        prefillSource: null
      });
      
      questions.push({
        id: `q-${timestamp}-m2`,
        text: "What emotional response should this evoke in the audience?",
        answer: "",
        isRelevant: true,
        category: pillarTitle,
        prefillSource: null
      });
      break;
      
    case 'Context':
    case 'Purpose':
    case 'Usage':
      questions.push({
        id: `q-${timestamp}-p1`,
        text: "What is the purpose or intended use of this?",
        answer: "",
        isRelevant: true,
        category: pillarTitle,
        prefillSource: null
      });
      
      questions.push({
        id: `q-${timestamp}-p2`,
        text: "Who is the target audience?",
        answer: "",
        isRelevant: true,
        category: pillarTitle,
        prefillSource: null
      });
      break;
      
    default:
      // Generic questions for other pillars
      questions.push({
        id: `q-${timestamp}-g1`,
        text: `What specific requirements do you have for ${pillarTitle.toLowerCase()}?`,
        answer: "",
        isRelevant: true,
        category: pillarTitle,
        prefillSource: null
      });
  }
  
  // Add custom questions based on missing information
  missingInfo.forEach((info, index) => {
    questions.push({
      id: `q-${timestamp}-mi${index}`,
      text: info.question,
      answer: "",
      isRelevant: true,
      category: pillarTitle,
      prefillSource: null
    });
  });
  
  return questions;
};

// Generate variables specific to a template pillar
const generateVariablesForPillar = (
  pillarTitle,
  entities,
  userPrompt,
  imageAnalysis,
  isSimple = false
) => {
  const timestamp = Date.now();
  const variables = [];
  let variableCount = 0;
  
  // Find main subject
  const mainSubject = entities.find(e => e.type === 'subject')?.value || inferMainSubject(userPrompt);
  
  switch (pillarTitle) {
    case 'Content':
    case 'Subject Matter':
      if (mainSubject) {
        variables.push({
          id: `v-${timestamp}-${variableCount++}`,
          name: "Subject",
          value: mainSubject,
          isRelevant: true,
          category: pillarTitle,
          code: `VAR_${variableCount}`
        });
      }
      
      // Extract colors as variables
      entities.filter(e => e.type === 'color').forEach((entity, index) => {
        variables.push({
          id: `v-${timestamp}-${variableCount++}`,
          name: index === 0 ? "Primary Color" : `Color ${index + 1}`,
          value: entity.value,
          isRelevant: true,
          category: pillarTitle,
          code: `VAR_${variableCount}`
        });
      });
      break;
      
    case 'Style':
    case 'Artistic Direction':
      variables.push({
        id: `v-${timestamp}-${variableCount++}`,
        name: "Art Style",
        value: "",
        isRelevant: true,
        category: pillarTitle,
        code: `VAR_${variableCount}`
      });
      
      if (!isSimple) {
        variables.push({
          id: `v-${timestamp}-${variableCount++}`,
          name: "Reference Artist",
          value: "",
          isRelevant: true,
          category: pillarTitle,
          code: `VAR_${variableCount}`
        });
      }
      break;
      
    case 'Technical':
    case 'Technical Specifications':
      // Extract dimensions as variables
      const dimensions = entities.filter(e => e.type === 'dimension');
      if (dimensions.length > 0) {
        dimensions.forEach((dim, index) => {
          variables.push({
            id: `v-${timestamp}-${variableCount++}`,
            name: index === 0 ? "Dimensions" : `Dimension ${index + 1}`,
            value: dim.value,
            isRelevant: true,
            category: pillarTitle,
            code: `VAR_${variableCount}`
          });
        });
      } else if (isVisualRequest(userPrompt)) {
        variables.push({
          id: `v-${timestamp}-${variableCount++}`,
          name: "Dimensions",
          value: "",
          isRelevant: true,
          category: pillarTitle,
          code: `VAR_${variableCount}`
        });
      }
      
      if (isVisualRequest(userPrompt) && !isSimple) {
        variables.push({
          id: `v-${timestamp}-${variableCount++}`,
          name: "File Format",
          value: "",
          isRelevant: true,
          category: pillarTitle,
          code: `VAR_${variableCount}`
        });
      }
      break;
      
    case 'Composition':
    case 'Layout':
      if (!isSimple) {
        variables.push({
          id: `v-${timestamp}-${variableCount++}`,
          name: "Background",
          value: "",
          isRelevant: true,
          category: pillarTitle,
          code: `VAR_${variableCount}`
        });
      }
      break;
      
    case 'Mood':
    case 'Atmosphere':
    case 'Emotional Impact':
      variables.push({
        id: `v-${timestamp}-${variableCount++}`,
        name: "Mood",
        value: "",
        isRelevant: true,
        category: pillarTitle,
        code: `VAR_${variableCount}`
      });
      break;
  }
  
  return variables;
};

// Helper function to find relevant image analysis for a question
const findRelevantImageAnalysisForQuestion = (question, imageAnalysis, userIntent) => {
  if (!imageAnalysis || typeof imageAnalysis !== 'object') return null;
  
  // Extract key terms from the question and user intent
  const questionText = question.text.toLowerCase();
  const userIntentLower = userIntent ? userIntent.toLowerCase() : '';
  
  // Check if the question is related to the intent
  const isQuestionRelatedToIntent = userIntentLower && 
    (questionText.includes(userIntentLower) || 
     userIntentLower.split(' ').some(word => word.length > 4 && questionText.includes(word)));
  
  // Don't pre-fill answers for questions unrelated to the user's intent
  if (userIntentLower && !isQuestionRelatedToIntent) {
    return null;
  }
  
  // Try to find analysis from the matching category first
  const category = question.category;
  if (imageAnalysis[category]) {
    return imageAnalysis[category];
  }
  
  // Look through all categories for relevant information based on question keywords
  const keywords = extractKeywordsFromQuestion(question.text);
  
  for (const [categoryName, analysisText] of Object.entries(imageAnalysis)) {
    if (typeof analysisText !== 'string') continue;
    
    const analysisTextLower = analysisText.toLowerCase();
    
    // Check if analysis contains any keywords from the question
    const relevantKeywords = keywords.filter(keyword => 
      analysisTextLower.includes(keyword.toLowerCase())
    );
    
    if (relevantKeywords.length > 0) {
      // Extract the specific section containing the keywords
      let relevantSection = analysisText;
      
      // If the analysis is long, try to extract just the relevant part
      if (analysisText.length > 100) {
        relevantKeywords.forEach(keyword => {
          const keywordIndex = analysisTextLower.indexOf(keyword.toLowerCase());
          if (keywordIndex > -1) {
            // Extract a window of text around the keyword (50 chars before and after)
            const startIndex = Math.max(0, keywordIndex - 50);
            const endIndex = Math.min(analysisText.length, keywordIndex + keyword.length + 50);
            relevantSection = analysisText.substring(startIndex, endIndex);
            
            // Make sure we have complete sentences
            if (startIndex > 0 && !relevantSection.match(/^[A-Z]/)) {
              relevantSection = "..." + relevantSection;
            }
            if (endIndex < analysisText.length) {
              // Try to end at a period
              const lastPeriod = relevantSection.lastIndexOf('.');
              if (lastPeriod > relevantSection.length / 2) {
                relevantSection = relevantSection.substring(0, lastPeriod + 1);
              } else {
                relevantSection += "...";
              }
            }
          }
        });
      }
      
      return relevantSection;
    }
  }
  
  return null;
};

// Helper function to find relevant image analysis for a variable
const findRelevantImageAnalysisForVariable = (variable, imageAnalysis) => {
  if (!imageAnalysis || typeof imageAnalysis !== 'object') return null;
  
  // Direct mapping for common variable names
  const variableName = variable.name.toLowerCase();
  
  // Check for direct matches in analysis categories
  if (variableName === 'art style' && imageAnalysis.Style) {
    // Extract just the style information
    const styleAnalysis = imageAnalysis.Style;
    const styleMention = extractStyleFromAnalysis(styleAnalysis);
    return styleMention || styleAnalysis.split('.')[0]; // First sentence as fallback
  }
  
  if (variableName === 'subject' && imageAnalysis['Subject Matter'] || imageAnalysis.Content) {
    const subjectAnalysis = imageAnalysis['Subject Matter'] || imageAnalysis.Content;
    const subjectMatch = subjectAnalysis.match(/main subject is (?:a|an|the)\s+([^.]+)/i);
    if (subjectMatch && subjectMatch[1]) {
      return subjectMatch[1].trim();
    }
    // Try to get just the first noun phrase
    const firstSentence = subjectAnalysis.split('.')[0];
    const nounPhraseMatch = firstSentence.match(/(?:features|contains|shows|depicts)\s+(?:a|an|the)\s+([^,]+)/i);
    return nounPhraseMatch ? nounPhraseMatch[1].trim() : null;
  }
  
  if ((variableName === 'primary color' || variableName.includes('color')) && 
     (imageAnalysis.Style || imageAnalysis['Color Palette'])) {
    const colorSource = imageAnalysis['Color Palette'] || imageAnalysis.Style;
    const colorMatches = colorSource.match(/(?:primary|dominant|main)\s+colors?\s+(?:is|are)\s+([^.]+)/i);
    if (colorMatches && colorMatches[1]) {
      return colorMatches[1].trim();
    }
    // Look for color names
    const colorNameMatch = colorSource.match(/\b(red|blue|green|yellow|purple|pink|orange|brown|black|white|gray|grey|teal|turquoise|gold|silver)\b/i);
    return colorNameMatch ? colorNameMatch[1] : null;
  }
  
  if (variableName === 'mood' && (imageAnalysis.Mood || imageAnalysis.Atmosphere)) {
    const moodSource = imageAnalysis.Mood || imageAnalysis.Atmosphere;
    const moodMatches = moodSource.match(/(?:mood|atmosphere|feeling)\s+(?:is|seems|appears)\s+([^.]+)/i);
    return moodMatches ? moodMatches[1].trim() : moodSource.split('.')[0];
  }
  
  if (variableName === 'dimensions' && imageAnalysis.Technical) {
    const dimensionMatches = imageAnalysis.Technical.match(/(\d+\s*x\s*\d+(?:\s*\w+)?)/i);
    return dimensionMatches ? dimensionMatches[1] : null;
  }
  
  return null;
};

// Helper function to extract keywords from a question
const extractKeywordsFromQuestion = (questionText) => {
  if (!questionText) return [];
  
  // Common stop words to ignore
  const stopWords = new Set([
    'a', 'an', 'the', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'can', 'could', 'may', 'might', 'must', 'shall', 'for', 'and', 'nor', 'but',
    'or', 'yet', 'so', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'what',
    'which', 'who', 'whom', 'whose', 'whither', 'whence', 'whereby'
  ]);
  
  // Extract potential keywords (words longer than 3 characters, not stop words)
  return questionText
    .replace(/[.,?!;:]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word.toLowerCase()));
};

// Helper function to identify missing information based on the pillar
const identifyMissingInformation = (pillarTitle, entities, userPrompt) => {
  const missingInfo = [];
  
  // Find main subject
  const mainSubject = entities.find(e => e.type === 'subject')?.value || inferMainSubject(userPrompt);
  
  if (mainSubject) {
    // Specific attributes missing for subject
    if (pillarTitle === 'Content' || pillarTitle === 'Subject Matter') {
      // Check for specific subject attributes based on common categories
      if (isPersonOrCharacter(mainSubject)) {
        if (!userPrompt.toLowerCase().match(/\b(age|old|young|adult|teen|child|elderly)\b/)) {
          missingInfo.push({ 
            question: `What is the age of the ${mainSubject}?`,
            type: 'attribute'
          });
        }
        if (!userPrompt.toLowerCase().match(/\b(male|female|man|woman|boy|girl|non-binary|gender)\b/)) {
          missingInfo.push({ 
            question: `What is the gender or appearance of the ${mainSubject}?`,
            type: 'attribute'
          });
        }
        if (!userPrompt.toLowerCase().match(/\b(wear|dress|clothe|outfit|costume|attire)\b/)) {
          missingInfo.push({ 
            question: `What is the ${mainSubject} wearing?`,
            type: 'attribute'
          });
        }
      } else if (isLocation(mainSubject)) {
        if (!userPrompt.toLowerCase().match(/\b(time|day|night|morning|evening|afternoon|season|winter|summer|fall|spring)\b/)) {
          missingInfo.push({ 
            question: `What time of day or season is it at the ${mainSubject}?`,
            type: 'attribute'
          });
        }
        if (!userPrompt.toLowerCase().match(/\b(weather|climate|sunny|rainy|cloudy|snowy|stormy)\b/)) {
          missingInfo.push({ 
            question: `What are the weather conditions at the ${mainSubject}?`,
            type: 'attribute'
          });
        }
      } else if (isObject(mainSubject)) {
        if (!entities.some(e => e.type === 'material')) {
          missingInfo.push({ 
            question: `What material is the ${mainSubject} made of?`,
            type: 'attribute'
          });
        }
        if (!entities.some(e => e.type === 'color')) {
          missingInfo.push({ 
            question: `What color is the ${mainSubject}?`,
            type: 'attribute'
          });
        }
      }
    }
  }
  
  return missingInfo;
};

// Helper function to infer the main subject from the prompt
const inferMainSubject = (prompt) => {
  if (!prompt) return '';
  
  // Most common pattern: "Create a [subject]", "Generate a [subject]", etc.
  const commonPatterns = [
    /(?:create|generate|make|design|draw|produce)\s+(?:a|an|the)?\s*([a-z][a-z\s]+?)(?:\s+(?:with|that|which|in|for|to|of|using)|\.|$)/i,
    /(?:I want|I need|I'm looking for|I'd like)\s+(?:a|an|the)?\s*([a-z][a-z\s]+?)(?:\s+(?:with|that|which|in|for|to|of|using)|\.|$)/i
  ];
  
  for (const pattern of commonPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Fallback: just use the first few words after removing common prefixes
  const cleanedPrompt = prompt
    .replace(/^(create|generate|make|design|draw|produce|i want|i need|please)/i, '')
    .trim();
  
  return cleanedPrompt.split(' ').slice(0, 3).join(' ');
};

// Helper function to check if a request is visual (image, design, etc.)
const isVisualRequest = (prompt) => {
  if (!prompt) return false;
  
  const visualTerms = [
    'image', 'picture', 'photo', 'illustration', 'design', 'artwork', 'drawing',
    'graphic', 'logo', 'sketch', 'render', 'painting', 'portrait', 'poster',
    'banner', 'mockup', 'visual', 'style frame'
  ];
  
  const promptLower = prompt.toLowerCase();
  return visualTerms.some(term => promptLower.includes(term));
};

// Helper function to check if the subject is a person or character
const isPersonOrCharacter = (subject) => {
  if (!subject) return false;
  
  const personTerms = [
    'person', 'man', 'woman', 'boy', 'girl', 'child', 'adult', 'teen', 'teenager',
    'character', 'hero', 'villain', 'protagonist', 'antagonist', 'figure', 'human',
    'guy', 'lady', 'male', 'female', 'player', 'actor', 'actress', 'model', 'warrior',
    'knight', 'wizard', 'witch', 'prince', 'princess', 'king', 'queen', 'soldier'
  ];
  
  const subjectLower = subject.toLowerCase();
  return personTerms.some(term => subjectLower.includes(term));
};

// Helper function to check if the subject is a location/place
const isLocation = (subject) => {
  if (!subject) return false;
  
  const locationTerms = [
    'landscape', 'scene', 'place', 'location', 'setting', 'environment', 'world',
    'city', 'town', 'village', 'forest', 'mountain', 'beach', 'desert', 'room',
    'interior', 'exterior', 'building', 'house', 'castle', 'palace', 'temple',
    'garden', 'park', 'street', 'road', 'river', 'lake', 'ocean', 'sea', 'sky'
  ];
  
  const subjectLower = subject.toLowerCase();
  return locationTerms.some(term => subjectLower.includes(term));
};

// Helper function to check if the subject is an object
const isObject = (subject) => {
  if (!subject) return false;
  
  // If it's not a person or location, assume it's an object
  return !isPersonOrCharacter(subject) && !isLocation(subject);
};

// Helper function to extract style information from text
const extractStyleFromAnalysis = (text) => {
  if (!text) return null;
  
  // Look for style mentions
  const stylePatterns = [
    /(?:style|aesthetic)(?:\s+is|\s+appears\s+to\s+be|\s+seems\s+to\s+be|\s+can\s+be\s+described\s+as)\s+([^.]+)/i,
    /illustrated\s+in\s+(?:a|an)\s+([^.]+?)\s+style/i,
    /(?:done|created|executed)\s+in\s+(?:a|an)\s+([^.]+?)\s+style/i
  ];
  
  for (const pattern of stylePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
};
