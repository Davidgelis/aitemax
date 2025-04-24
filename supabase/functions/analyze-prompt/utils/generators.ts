
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
  
  // If no direct matches, try fuzzy matching using question text context
  const questionKeywords = extractQuestionSemanticKeywords(questionText);
  for (const [key, mapping] of Object.entries(analysisMapping)) {
    if (questionKeywords.includes(key) || questionKeywords.some(kw => key.includes(kw))) {
      const formattedInfo = mapping.format(imageAnalysis);
      if (formattedInfo) {
        // Clean any numbered questions
        const cleanedInfo = formattedInfo.replace(/\d+\.\s+[^.?!]*\?/g, '').trim();
        if (cleanedInfo) {
          console.log(`Found match by question semantic keyword match "${key}"`);
          return `Based on image analysis: ${cleanedInfo}`;
        }
      }
    }
  }
  
  // As a last resort, if the question seems important, try to match with any related data
  if (questionText.includes('important') || questionText.includes('key') || questionText.includes('main')) {
    // Look for any content about subjects, elements, or recommendations
    for (const key of ['subject', 'elements', 'details', 'recommendations', 'overview']) {
      if (imageAnalysis[key]) {
        const info = typeof imageAnalysis[key] === 'string' ? 
          imageAnalysis[key] : 
          JSON.stringify(imageAnalysis[key]).replace(/[{}"]/g, '');
        
        // Clean any numbered questions
        const cleanedInfo = info.replace(/\d+\.\s+[^.?!]*\?/g, '').trim();
        if (cleanedInfo) {
          console.log(`Last resort match with "${key}" for important question`);
          return `Based on image analysis: ${cleanedInfo}`;
        }
      }
    }
  }
  
  console.log(`No relevant image info found for question: "${questionText.substring(0, 30)}..."`);
  return null;
}

// Additional function to generate context variables from templates and image analysis
export function generateContextualVariablesForPrompt(
  promptText: string,
  template: any = null,
  imageAnalysis: any = null,
  smartContext: any = null,
  useMinimalVariables: boolean = false
): Variable[] {
  const variables: Variable[] = [];
  
  // Start with basic set of variables
  const baseVariables = useMinimalVariables ? 
    getMinimalVariablesSet() : 
    getComprehensiveVariablesSet();
  
  // Add basic variables with automatic categories
  baseVariables.forEach(v => variables.push({
    ...v,
    id: `var-${variables.length + 1}`
  }));
  
  // If we have image analysis data, prefill relevant variables
  if (imageAnalysis && typeof imageAnalysis === 'object') {
    prefillVariablesFromImageAnalysis(variables, imageAnalysis);
  }
  
  return variables;
}

// Get a minimal set of variables for simple prompts
function getMinimalVariablesSet(): Variable[] {
  return [
    {
      id: 'var-1',
      name: 'style',
      value: '',
      category: 'Style',
      isRelevant: true,
      description: 'The artistic or visual style for this creation',
      contextSource: undefined
    },
    {
      id: 'var-2',
      name: 'subject',
      value: '',
      category: 'Content',
      isRelevant: true,
      description: 'The main subject or focus',
      contextSource: undefined
    },
    {
      id: 'var-3',
      name: 'colors',
      value: '',
      category: 'Style',
      isRelevant: true,
      description: 'Key colors or color palette',
      contextSource: undefined
    }
  ];
}

// Get a more comprehensive set of variables
function getComprehensiveVariablesSet(): Variable[] {
  return [
    {
      id: 'var-1',
      name: 'style',
      value: '',
      category: 'Style',
      isRelevant: true,
      description: 'The artistic or visual style for this creation',
      contextSource: undefined
    },
    {
      id: 'var-2',
      name: 'subject',
      value: '',
      category: 'Content',
      isRelevant: true,
      description: 'The main subject or focus',
      contextSource: undefined
    },
    {
      id: 'var-3',
      name: 'colors',
      value: '',
      category: 'Style',
      isRelevant: true,
      description: 'Key colors or color palette',
      contextSource: undefined
    },
    {
      id: 'var-4',
      name: 'mood',
      value: '',
      category: 'Style',
      isRelevant: true,
      description: 'The emotional tone or mood',
      contextSource: undefined
    },
    {
      id: 'var-5',
      name: 'background',
      value: '',
      category: 'Content',
      isRelevant: true,
      description: 'Background elements or setting',
      contextSource: undefined
    },
    {
      id: 'var-6',
      name: 'lighting',
      value: '',
      category: 'Technical',
      isRelevant: true,
      description: 'Lighting style or conditions',
      contextSource: undefined
    },
    {
      id: 'var-7',
      name: 'details',
      value: '',
      category: 'Content',
      isRelevant: true,
      description: 'Specific details to include',
      contextSource: undefined
    }
  ];
}

// Prefill variables with image analysis data
function prefillVariablesFromImageAnalysis(variables: Variable[], imageAnalysis: any): void {
  // Map of variable names to possible image analysis properties
  const variableToAnalysisMap: Record<string, string[]> = {
    'style': ['style', 'artisticStyle', 'aesthetic', 'visualStyle'],
    'subject': ['subject', 'mainSubject', 'content', 'focus'],
    'colors': ['colors', 'palette', 'dominantColors', 'colorScheme'],
    'mood': ['mood', 'atmosphere', 'emotion', 'feeling'],
    'background': ['background', 'setting', 'environment', 'scene'],
    'lighting': ['lighting', 'light', 'shadows', 'illumination'],
    'details': ['details', 'elements', 'features', 'specifics']
  };
  
  // Prefill variables with matching data from analysis
  variables.forEach(variable => {
    const possibleProperties = variableToAnalysisMap[variable.name] || [variable.name];
    
    // First try direct property match
    for (const prop of possibleProperties) {
      if (imageAnalysis[prop]) {
        if (typeof imageAnalysis[prop] === 'string') {
          variable.value = imageAnalysis[prop];
          variable.contextSource = 'image';
          break;
        } else if (typeof imageAnalysis[prop] === 'object' && imageAnalysis[prop] !== null) {
          // If it's an object, try to create a meaningful description
          const keyValues = Object.entries(imageAnalysis[prop])
            .filter(([k, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          
          if (keyValues) {
            variable.value = keyValues;
            variable.contextSource = 'image';
            break;
          }
        }
      }
    }
    
    // If still no value, look deeper in nested objects
    if (!variable.value) {
      for (const [key, value] of Object.entries(imageAnalysis)) {
        if (typeof value === 'object' && value !== null) {
          for (const prop of possibleProperties) {
            if (value[prop]) {
              variable.value = String(value[prop]);
              variable.contextSource = 'image';
              break;
            }
          }
          if (variable.value) break;
        }
      }
    }
  });
}

// Function to map technical terms to descriptions and examples for UI display
export function addTechnicalTerms(questions: Question[]): Question[] {
  const technicalTermMapping: Record<string, Array<{term: string, explanation: string, example: string}>> = {
    'style': [
      {
        term: 'Minimalism',
        explanation: 'A style characterized by simplicity and the reduction of elements to only what is essential',
        example: 'Clean lines, limited color palette, ample white space, geometric forms'
      },
      {
        term: 'Art Deco',
        explanation: 'A bold, geometric style popular in the 1920s and 30s known for its elegance and symmetry',
        example: 'Bold curves, zigzag patterns, vibrant colors, streamlined forms'
      }
    ],
    'composition': [
      {
        term: 'Rule of Thirds',
        explanation: 'A guideline that divides the image into nine equal parts by two horizontal and two vertical lines, placing key elements along these lines or at their intersections',
        example: 'Placing the horizon on the upper or lower third line, or a subject at an intersection point'
      },
      {
        term: 'Golden Ratio',
        explanation: 'A mathematical ratio (approximately 1:1.618) that creates a naturally pleasing composition',
        example: 'Spiral arrangements, balanced proportions, natural-feeling visual harmony'
      }
    ]
  };
  
  // For each question, check if we have terms to add based on its category
  return questions.map(question => {
    const category = question.category.toLowerCase();
    
    // Check if we have terms for this category
    for (const [key, terms] of Object.entries(technicalTermMapping)) {
      if (category.includes(key) || question.text.toLowerCase().includes(key)) {
        // Add terms as they match the category
        return {
          ...question,
          technicalTerms: terms
        };
      }
    }
    
    return question;
  });
}
