import { Question, Variable } from '../types.ts';

export function generateContextQuestionsForPrompt(
  promptText: string,
  template: any = null,
  smartContext: any = null,
  imageAnalysis: any = null,
  userIntent: string = ''
): Question[] {
  console.log("Generating comprehensive context questions based on user intent and template pillars");
  console.log(`Working with user intent: "${userIntent}"`);
  
  const questions: Question[] = [];
  
  // Step 1: Generate a complete set of questions based on user intent and template pillars
  if (template?.pillars?.length > 0) {
    // Calculate max questions per pillar to ensure good coverage
    const maxQuestionsPerPillar = Math.min(4, Math.ceil(12 / template.pillars.length));
    
    template.pillars.forEach((pillar: any, index: number) => {
      if (pillar && pillar.title) {
        const pillarQuestions = generateQuestionsForPillar(promptText, pillar, maxQuestionsPerPillar, userIntent);
        questions.push(...pillarQuestions);
      }
    });
  } else {
    // If no template pillars, generate generic context questions
    const genericQuestions = generateGenericContextQuestions(promptText, userIntent);
    questions.push(...genericQuestions);
  }

  // Step 2: Only after generating all questions, fill relevant ones with image analysis data
  if (imageAnalysis) {
    console.log("Filling relevant questions with detailed image analysis data", {
      imageAnalysisFields: typeof imageAnalysis === 'object' ? Object.keys(imageAnalysis) : 'invalid',
      questionsBeforeFilling: questions.length,
      pillarsInQuestions: [...new Set(questions.map(q => q.category))].join(', '),
      userIntent
    });
    
    // Log available analysis data for pillars
    if (typeof imageAnalysis === 'object') {
      const pillarSpecificData = Object.keys(imageAnalysis).filter(key => {
        return questions.some(q => q.category.toLowerCase() === key.toLowerCase() || 
                                 q.category.toLowerCase().includes(key.toLowerCase()) ||
                                 key.toLowerCase().includes(q.category.toLowerCase()));
      });
      
      console.log(`Image analysis data available for pillars: ${pillarSpecificData.join(', ')}`);
    }
    
    // First try to match questions with pillar-specific image analysis
    const filledPillars = new Set<string>();
    
    // Track how many questions are filled per pillar for logging
    const filledByPillar: Record<string, number> = {};
    
    questions.forEach(question => {
      // First check if question is relevant to user intent
      const isRelevantToIntent = isQuestionRelevantToIntent(question.text, userIntent);
      
      if (isRelevantToIntent) {
        // First try direct pillar match
        const pillarMatch = findPillarBasedImageInfo(question, imageAnalysis, userIntent);
        
        if (pillarMatch) {
          question.answer = pillarMatch;
          question.contextSource = 'image';
          filledPillars.add(question.category);
          
          // Count filled questions per pillar
          filledByPillar[question.category] = (filledByPillar[question.category] || 0) + 1;
          
          console.log(`Prefilled intent-relevant question in "${question.category}" pillar: "${question.text.substring(0, 30)}..."`);
        }
      } else {
        console.log(`Skipped filling question not relevant to user intent: "${question.text.substring(0, 30)}..."`);
      }
    });
    
    // For questions still not filled but relevant to intent, try with generic matching
    questions.forEach(question => {
      const isRelevantToIntent = isQuestionRelevantToIntent(question.text, userIntent);
      
      if (isRelevantToIntent && !question.answer) {
        const relevantImageInfo = findDetailedRelevantImageInfo(question, imageAnalysis, userIntent);
        if (relevantImageInfo) {
          question.answer = relevantImageInfo;
          question.contextSource = 'image';
          filledPillars.add(question.category);
          
          // Count filled questions per pillar
          filledByPillar[question.category] = (filledByPillar[question.category] || 0) + 1;
          
          console.log(`Prefilled question with generic match in "${question.category}" pillar: "${question.text.substring(0, 30)}..."`);
        }
      }
    });
    
    console.log(`After filling: ${questions.filter(q => q.answer).length} questions have prefilled answers`);
    console.log(`Pillars with prefilled questions: ${Array.from(filledPillars).join(', ')}`);
    console.log(`Questions filled per pillar:`, filledByPillar);
    
    // Look for and mark any duplicate answers
    const uniqueAnswers = new Set<string>();
    questions.forEach(question => {
      if (question.answer) {
        const simplifiedAnswer = simplifyAnswer(question.answer);
        if (uniqueAnswers.has(simplifiedAnswer)) {
          // Mark duplicates to be filtered out later
          console.log(`Found duplicate prefilled answer in question: "${question.text.substring(0, 30)}..."`);
          question.isDuplicate = true;
        } else {
          uniqueAnswers.add(simplifiedAnswer);
        }
      }
    });
    
    // Remove duplicates if requested
    const filteredQuestions = questions.filter(q => !q.isDuplicate);
    if (filteredQuestions.length < questions.length) {
      console.log(`Removed ${questions.length - filteredQuestions.length} questions with duplicate answers`);
      return filteredQuestions;
    }
  }

  console.log(`Generated ${questions.length} total questions, ${questions.filter(q => q.answer).length} with prefilled answers`);
  return questions;
}

// Helper function to test if a question is relevant to user intent
function isQuestionRelevantToIntent(questionText: string, userIntent: string): boolean {
  if (!userIntent) return true; // If no intent provided, consider all questions relevant
  
  // Get important words from intent, minimum 3 chars
  const intentWords = userIntent.toLowerCase().split(/\s+/)
    .filter(word => word.length > 2)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(Boolean);
  
  if (intentWords.length === 0) return true;
  
  // Check if any intent word is in the question
  const questionLower = questionText.toLowerCase();
  return intentWords.some(word => questionLower.includes(word));
}

// Simplify an answer for duplicate detection
function simplifyAnswer(answer: string): string {
  if (!answer) return '';
  
  // Remove "Based on image analysis: " prefix
  let simplified = answer.replace(/^Based on image analysis:\s*/i, '');
  
  // Remove punctuation, normalize spaces
  simplified = simplified.replace(/[.,;:]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  
  // Keep only first 50 chars for comparison
  return simplified.substring(0, 50);
}

function generateQuestionsForPillar(promptText: string, pillar: any, maxQuestions: number, userIntent: string = ''): Question[] {
  const questions: Question[] = [];
  const pillarTitle = pillar.title.toLowerCase();
  
  // Extract core intent and keywords
  const intentWords = userIntent ? extractKeywords(userIntent) : [];
  const promptKeywords = extractKeywords(promptText);
  
  // Prioritize intent keywords over prompt keywords
  const combinedKeywords = [...new Set([...intentWords, ...promptKeywords])];
  console.log(`Using keywords for ${pillar.title}: ${combinedKeywords.join(', ')}`);

  // Extract main action and subject from prompt
  const actionMatch = promptText.match(/(?:want to|need to|please)?\s*(create|make|generate|design|draw|build|develop|produce)\s+(?:an?|the)?\s*([^,.]+)/i);
  const mainAction = actionMatch?.[1] || '';
  const mainSubject = actionMatch?.[2] || '';

  // Customize question templates based on intent
  const baseTemplates = getBaseTemplatesForPillar(pillarTitle);
  const contextualizedTemplates = customizeTemplatesForIntent(baseTemplates, mainAction, mainSubject, combinedKeywords);
  
  // Generate questions maintaining the pillar structure but aligned with user intent
  const relevantQuestions = contextualizedTemplates
    .map(template => customizeQuestionWithIntent(template, combinedKeywords, userIntent))
    .filter(Boolean)
    .slice(0, maxQuestions);

  // Create questions with proper structure
  relevantQuestions.forEach((questionText, index) => {
    questions.push({
      id: `q-${pillarTitle}-${index + 1}`,
      text: questionText,
      answer: "",
      isRelevant: true,
      category: pillar.title,
      contextSource: undefined
    });
  });

  return questions;
}

function getBaseTemplatesForPillar(pillarType: string): string[] {
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
    ],
    subject: [
      "What specific details about the main subject are important?",
      "What characteristics or features should the subject have?",
      "How should the subject interact with its surroundings?",
      "What perspective or viewpoint should be used for the subject?"
    ],
    mood: [
      "What emotional response should this evoke?",
      "What atmosphere or feeling should dominate the piece?",
      "Should the mood be consistent throughout or vary in different areas?",
      "What sensory experiences should this suggest beyond just visual?"
    ]
  };

  // First check for direct matches in pillar type
  for (const [key, templates] of Object.entries(questionTemplates)) {
    if (pillarType.includes(key)) {
      return templates;
    }
  }

  // If no direct match, check for semantic similarity
  for (const [key, templates] of Object.entries(questionTemplates)) {
    const relatedTerms: {[key: string]: string[]} = {
      'style': ['design', 'look', 'appearance', 'aesthetic', 'artistic', 'visual'],
      'technical': ['specs', 'requirements', 'format', 'size', 'dimensions', 'quality'],
      'content': ['elements', 'subjects', 'components', 'material', 'objects'],
      'purpose': ['goal', 'objective', 'aim', 'intent', 'function', 'use'],
      'color': ['palette', 'hue', 'tone', 'shade', 'tint', 'colorful'],
      'composition': ['layout', 'arrangement', 'structure', 'organization', 'positioning'],
      'context': ['setting', 'environment', 'situation', 'circumstance', 'background'],
      'subject': ['main', 'focus', 'object', 'element', 'topic', 'theme'],
      'mood': ['feeling', 'emotion', 'atmosphere', 'ambiance', 'tone', 'vibe']
    };
    
    if (relatedTerms[key] && relatedTerms[key].some(term => pillarType.includes(term))) {
      return templates;
    }
  }

  // If no specific match found, use generic questions
  return [
    `What are your specific requirements for ${pillarType}?`,
    `What are your goals regarding ${pillarType}?`,
    `Are there any particular preferences or constraints for ${pillarType}?`,
    `How should ${pillarType} contribute to the overall output?`
  ];
}

function customizeTemplatesForIntent(templates: string[], action: string, subject: string, keywords: string[]): string[] {
  return templates.map(template => {
    let customized = template;
    
    if (action && subject) {
      customized = customized
        .replace(/this creation/g, `this ${subject}`)
        .replace(/the final result/g, `the ${subject}`)
        .replace(/the output/g, `the ${subject}`);
    }
    
    keywords.forEach(keyword => {
      if (keyword && keyword.length > 3) {
        customized = customized.replace(/this project/g, `this ${keyword}`);
      }
    });
    
    return customized;
  });
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

// Customize question with user intent keywords - enhanced version
function customizeQuestionWithIntent(question: string, keywords: string[], userIntent: string = ''): string {
  if (keywords.length === 0) return question;
  
  // Extract a few important words from user intent if available
  const intentWords = userIntent
    ? userIntent.split(' ').filter(w => w.length > 3).slice(0, 2)
    : [];
    
  // For questions that can be customized with the user's intent
  if (Math.random() > 0.3) {
    // Use intent words if available, otherwise fall back to keywords
    const wordsToUse = intentWords.length > 0 ? intentWords : keywords;
    const keyword = wordsToUse[Math.floor(Math.random() * wordsToUse.length)];
    
    if (question.includes("?")) {
      // Replace various templates in the question with the keyword
      if (question.includes("this creation")) {
        return question.replace("this creation", `your ${keyword}`);
      }
      else if (question.includes("the final result")) {
        return question.replace("the final result", `the ${keyword}`);
      }
      else if (question.includes(" this ")) {
        return question.replace(" this ", ` the ${keyword} `);
      }
      else {
        return question.replace("?", ` for your ${keyword}?`);
      }
    }
  }
  
  return question;
}

// Generate generic context questions when no template is available
function generateGenericContextQuestions(promptText: string, userIntent: string = ''): Question[] {
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
  
  // Get keywords from both prompt and user intent for better customization
  const promptKeywords = extractKeywords(promptText);
  const intentKeywords = userIntent ? extractKeywords(userIntent) : [];
  
  // Combine keywords, prioritizing intent keywords
  const combinedKeywords = [...new Set([...intentKeywords, ...promptKeywords])];
  
  let questionCount = 0;
  
  categories.forEach(category => {
    const categoryQuestions = category.questions.map(q => 
      customizeQuestionWithIntent(q, combinedKeywords, userIntent)
    );
    
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

// Modified function: find pillar-based image analysis information without numbered sub-questions
function findPillarBasedImageInfo(question: Question, imageAnalysis: any, userIntent: string = ''): string | null {
  if (!imageAnalysis || typeof imageAnalysis !== 'object') {
    console.log("No valid image analysis data available for pillar matching");
    return null;
  }
  
  const category = question.category.toLowerCase();
  const questionText = question.text.toLowerCase();
  
  // Check if the question is relevant to the user's intent
  const isRelevantToIntent = userIntent ? 
    isQuestionRelevantToIntent(questionText, userIntent) : true;
  
  if (!isRelevantToIntent) {
    console.log(`Question not relevant to user intent "${userIntent.substring(0, 30)}...": "${questionText.substring(0, 30)}..."`);
    return null;
  }
  
  console.log(`Searching for pillar-based image analysis for "${category}" category relevant to intent: "${userIntent}"`);
  
  // First look for direct pillar match in the image analysis
  for (const [key, data] of Object.entries(imageAnalysis)) {
    if (key.toLowerCase() === category || 
        category.includes(key.toLowerCase()) || 
        key.toLowerCase().includes(category)) {
      
      console.log(`Found direct pillar match between question category "${category}" and analysis section "${key}"`);
      
      if (typeof data === 'string') {
        // Remove any numbered questions/patterns like "1. question? 2. another question?"
        const cleanedData = data.replace(/\d+\.\s+[^.?!]*\?/g, '').trim();
        return cleanedData ? `Based on image analysis: ${cleanedData}` : null;
      } else if (typeof data === 'object' && data !== null) {
        // Convert object to formatted text, filtering out any elements that look like questions
        const formattedData = Object.entries(data)
          .filter(([k, v]) => v !== null && v !== undefined && v !== '' && !String(v).match(/\d+\.\s+[^.?!]*\?/))
          .map(([k, v]) => `${k}: ${v}`)
          .join('. ');
          
        if (formattedData) {
          return `Based on image analysis: ${formattedData}`;
        }
      }
    }
  }
  
  // If no direct match, try looking for content about this pillar inside other pillars
  for (const [key, data] of Object.entries(imageAnalysis)) {
    if (typeof data === 'object' && data !== null) {
      // Check if any keys in this section match our category
      const matchingKeys = Object.keys(data).filter(k => 
        k.toLowerCase() === category || 
        k.toLowerCase().includes(category) || 
        category.includes(k.toLowerCase())
      );
      
      if (matchingKeys.length > 0) {
        console.log(`Found match in nested data for "${category}" within section "${key}"`);
        
        // Extract relevant data for this category, removing any numbered questions patterns
        const relevantData = matchingKeys
          .map(k => {
            if (typeof data[k] === 'string') {
              const cleanedValue = String(data[k]).replace(/\d+\.\s+[^.?!]*\?/g, '').trim();
              return cleanedValue ? `${k}: ${cleanedValue}` : null;
            }
            return `${k}: ${data[k]}`;
          })
          .filter(Boolean)
          .join('. ');
          
        if (relevantData) {
          return `Based on image analysis: ${relevantData}`;
        }
      }
    }
  }
  
  // If we still can't find a match, check for semantic similarity between question text and analysis
  const questionKeywords = extractQuestionSemanticKeywords(questionText);
  
  for (const [key, data] of Object.entries(imageAnalysis)) {
    // Check if any of the question keywords match this analysis section
    const sectionMatchesQuestion = questionKeywords.some(keyword => 
      key.toLowerCase().includes(keyword)
    );
    
    if (sectionMatchesQuestion) {
      console.log(`Found semantic match between question keywords and section "${key}"`);
      
      if (typeof data === 'string') {
        // Clean any numbered questions patterns
        const cleanedData = String(data).replace(/\d+\.\s+[^.?!]*\?/g, '').trim();
        return cleanedData ? `Based on image analysis: ${cleanedData}` : null;
      } else if (typeof data === 'object' && data !== null) {
        const formattedData = Object.entries(data)
          .filter(([k, v]) => {
            if (v === null || v === undefined || v === '') return false;
            // Filter out entries that look like numbered questions
            if (typeof v === 'string' && v.match(/\d+\.\s+[^.?!]*\?/)) return false;
            return true;
          })
          .map(([k, v]) => `${k}: ${v}`)
          .join('. ');
          
        if (formattedData) {
          return `Based on image analysis: ${formattedData}`;
        }
      }
    }
  }
  
  console.log(`No pillar-based match found for "${category}" in image analysis`);
  return null;
}

// Extract key semantic concepts from a question
function extractQuestionSemanticKeywords(questionText: string): string[] {
  const semanticMapping: {[key: string]: string[]} = {
    'style': ['artistic', 'aesthetic', 'look', 'visual', 'appearance', 'stylization', 'design'],
    'color': ['palette', 'scheme', 'hue', 'tone', 'shade', 'tint', 'colorful', 'colors'],
    'composition': ['arrangement', 'layout', 'hierarchy', 'elements', 'structure', 'focal', 'balance'],
    'mood': ['feeling', 'atmosphere', 'emotion', 'convey', 'tone', 'ambience', 'vibe'],
    'technical': ['dimensions', 'resolution', 'format', 'quality', 'specifications', 'constraints', 'platform'],
    'subject': ['main', 'content', 'elements', 'features', 'details', 'object', 'focus'],
    'purpose': ['intended', 'audience', 'message', 'communicate', 'goal', 'action', 'use'],
    'context': ['environment', 'displayed', 'cultural', 'regional', 'viewing', 'themes', 'concepts']
  };
  
  const results = [];
  
  // Check each semantic category
  for (const [category, keywords] of Object.entries(semanticMapping)) {
    if (keywords.some(keyword => questionText.includes(keyword))) {
      results.push(category);
    }
  }
  
  return results.length > 0 ? results : ['general'];
}

function findDetailedRelevantImageInfo(question: Question, imageAnalysis: any, userIntent: string = ''): string | null {
  if (!imageAnalysis) {
    console.log("No image analysis data available");
    return null;
  }
  
  const questionText = question.text.toLowerCase();
  const category = question.category.toLowerCase();
  
  // Check if the question is relevant to the user's intent
  const isRelevantToIntent = userIntent ? 
    isQuestionRelevantToIntent(questionText, userIntent) : true;
  
  if (!isRelevantToIntent) {
    console.log(`Question not relevant to user intent for generic matching: "${questionText.substring(0, 30)}..."`);
    return null;
  }
  
  console.log(`Finding image info for question category: "${category}", text: "${questionText.substring(0, 30)}..."`);

  const analysisMapping: { [key: string]: {fields: string[], format: (data: any) => string | null} } = {
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
          // Clean any numbered questions that might be in the formatted info
          const cleanedInfo = formattedInfo.replace(/\d+\.\s+[^.?!]*\?/g, '').trim();
          if (cleanedInfo) {
            console.log(`Found match by category word "${categoryWord}" -> "${key}"`);
            return `Based on image analysis: ${cleanedInfo}`;
          }
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
        // Clean any numbered questions
        const cleanedInfo = formattedInfo.replace(/\d+\.\s+[^.?!]*\?/g, '').trim();
        if (cleanedInfo) {
          console.log(`Found match by partial category match "${key}"`);
          return `Based on image analysis: ${cleanedInfo}`;
        }
      }
    }
  }
  
  // If no matches by category, try by question text
  for (const [key, mapping] of Object.entries(analysisMapping)) {
    if (questionText.includes(key) || mapping.fields.some(field => questionText.includes(field))) {
      const formattedInfo = mapping.format(imageAnalysis);
      if (formattedInfo) {
        // Clean any numbered questions
        const cleanedInfo = formattedInfo.replace(/\d+\.\s+[^.?!]*\?/g, '').trim();
        if (cleanedInfo) {
          console.log(`Found match by question text for "${key}"`);
          return `Based on image analysis: ${cleanedInfo}`;
        }
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
      // Clean any numbered questions from the description
      const cleanedDescription = imageAnalysis.description.replace(/\d+\.\s+[^.?!]*\?/g, '').trim();
      if (cleanedDescription) {
        console.log("Using description as fallback");
        return `Based on image analysis: ${cleanedDescription}`;
      }
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
  
  // Check for pillar-specific variables
  Object.entries(analysis).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      // Check if this pillar has variable data
      console.log(`Checking pillar "${key}" for variable data`);
      
      if (key.toLowerCase().includes('style') || key.toLowerCase().includes('visual')) {
        const styleVar = variables.find(v => v.name === "Style/Aesthetic");
        if (styleVar && !styleVar.value && value.description) {
          styleVar.value = value.description;
          styleVar.contextSource = "image";
          console.log(`Prefilled "Style/Aesthetic" with "${styleVar.value}" from pillar "${key}"`);
        }
      }
      
      if (key.toLowerCase().includes('color') || key.toLowerCase().includes('palette')) {
        const colorVar = variables.find(v => v.name === "Color Scheme");
        if (colorVar && !colorVar.value) {
          if (Array.isArray(value)) {
            colorVar.value = value.join(', ');
          } else if (typeof value === 'string') {
            colorVar.value = value;
          } else if (value.palette) {
            colorVar.value = value.palette;
          }
          
          if (colorVar.value) {
            colorVar.contextSource = "image";
            console.log(`Prefilled "Color Scheme" with "${colorVar.value}" from pillar "${key}"`);
          }
        }
      }
    }
  });
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
