import { Question, Variable } from '../types.ts';

// Add a STOP set for filtering out common/useless variable names
const STOP = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'it', 'its',
  'image', 'picture', 'photo', 'illustration', 'drawing', 'artwork',
  'example', 'something', 'anything', 'nothing', 'everything',
  'one', 'ones', 'someone', 'anyone', 'no one', 'everyone'
]);

// match our edge‐function's MAX_EXAMPLES
const MAX_EXAMPLES = 4;

export function generateContextQuestionsForPrompt(
  promptText: string,
  template: any,
  smartContext: any = null,
  imageAnalysis: any = null,
  userIntent: string
): Question[] {
  const questions: Question[] = [];
  let questionId = 1;

  if (!promptText || promptText.trim().length < 3) {
    console.log("Prompt text too short or empty");
    return [];
  }

  // Extract meaningful phrases and concepts from the prompt
  const promptElements = extractMeaningfulElements(promptText);
  console.log("Extracted meaningful elements:", promptElements);

  // Generate base contextual questions based on the prompt content
  const baseQuestions = generateContentSpecificQuestions(promptText, promptElements, userIntent);
  questions.push(...baseQuestions.map((q: any) => ({
    id: `q-${questionId++}`,
    text: q.text,
    answer: "",  // don't prefill the answer with the examples text
    isRelevant: true,
    category: q.category || 'Context',
    contextSource: 'prompt',
    examples: Array.isArray(q.examples)
      ? q.examples.slice(0, MAX_EXAMPLES)
      : []
  })));

  // Process each subject with more contextual awareness
  promptElements.subjects.forEach(subject => {
    // Only generate questions for meaningful subjects
    if (subject.text.length > 2 && !isCommonWord(subject.text)) {
      const subjectQuestions = generateEnhancedSubjectQuestions(subject, promptText, userIntent);
      questions.push(...subjectQuestions.map(q => ({
        id: `q-${questionId++}`,
        text: q.text,
        answer: "",  // don't prefill the answer with the examples text
        isRelevant: true,
        category: q.category || 'Subject Details',
        contextSource: 'prompt',
        examples: Array.isArray(q.examples)
          ? q.examples.slice(0, MAX_EXAMPLES)
          : []
      })));
    }
  });

  // Generate action-based questions with better context
  promptElements.actions.forEach(action => {
    if (action.text.length > 2) {
      const actionQuestions = generateEnhancedActionQuestions(action, promptText, promptElements.subjects);
      questions.push(...actionQuestions.map(q => ({
        id: `q-${questionId++}`,
        text: q.text,
        answer: "",  // don't prefill the answer with the examples text
        isRelevant: true,
        category: 'Action Details',
        contextSource: 'prompt',
        examples: Array.isArray(q.examples)
          ? q.examples.slice(0, MAX_EXAMPLES)
          : []
      })));
    }
  });

  // Generate questions about attributes with context
  promptElements.attributes.forEach(attribute => {
    if (attribute.text.length > 2) {
      const attributeQuestions = generateContextualAttributeQuestions(attribute, promptText, promptElements.subjects);
      questions.push(...attributeQuestions.map(q => ({
        id: `q-${questionId++}`,
        text: q.text,
        answer: "",  // don't prefill the answer with the examples text
        isRelevant: true,
        category: 'Attributes',
        contextSource: 'prompt',
        examples: Array.isArray(q.examples)
          ? q.examples.slice(0, MAX_EXAMPLES)
          : []
      })));
    }
  });

  // Generate additional context questions based on intent
  const intentQuestions = generateIntentBasedQuestions(userIntent, promptText);
  questions.push(...intentQuestions.map(q => ({
    id: `q-${questionId++}`,
    text: q.text,
    answer: "",  // don't prefill the answer with the examples text
    isRelevant: true,
    category: q.category || 'Intent',
    contextSource: 'prompt',
    examples: Array.isArray(q.examples)
      ? q.examples.slice(0, MAX_EXAMPLES)
      : []
  })));

  // If we still have too few questions, generate additional general questions
  if (questions.length < 5) {
    const generalQuestions = generateAdditionalQuestions(promptText, promptElements);
    questions.push(...generalQuestions.map(q => ({
      id: `q-${questionId++}`,
      text: q.text,
      answer: "",  // don't prefill the answer with the examples text
      isRelevant: true,
      category: q.category || 'General',
      contextSource: 'prompt',
      examples: Array.isArray(q.examples)
        ? q.examples.slice(0, MAX_EXAMPLES)
        : []
    })));
  }

  // Final grammatical validation for all questions
  const validatedQuestions = questions.map(q => {
    // Fix common grammatical issues
    q.text = fixGrammaticalErrors(q.text);
    return q;
  });

  return validatedQuestions;
}

// New function to fix grammatical errors
function fixGrammaticalErrors(text: string): string {
  if (!text) return text;
  
  // Fix 'n image' issues - replace patterns like "n image" with "an image"
  text = text.replace(/\bn\s+(image|illustration|artwork|picture|photo)/gi, "an $1");
  text = text.replace(/\bn\s+([aeiou][a-z]*)/gi, "an $1"); // Fix 'n' + vowel words
  text = text.replace(/\bn\s+([^aeiou][a-z]*)/gi, "a $1"); // Fix 'n' + consonant words
  
  // Fix article issues with proper indefinite articles
  text = text.replace(/\ba\s+([aeiou][a-z]*)/gi, "an $1"); // Replace 'a' with 'an' before vowels
  
  // Fix common preposition errors
  text = text.replace(/\sof\s+the\s+the\s+/gi, " of the ");
  
  // Fix double articles
  text = text.replace(/\b(a|an|the)\s+(a|an|the)\b/gi, "$1");
  
  // Fix spaces around punctuation
  text = text.replace(/\s+([.,?!])/g, "$1");
  
  // Fix "the the" duplications
  text = text.replace(/\bthe\s+the\b/gi, "the");
  
  // Fix capitalization after question mark
  text = text.replace(/\?\s+([a-z])/g, (match, letter) => `? ${letter.toUpperCase()}`);
  
  return text;
}

type PromptElement = {
  text: string;
  context?: string;
  importance: number;
};

type ExtractedElements = {
  subjects: PromptElement[];
  actions: PromptElement[];
  attributes: PromptElement[];
  context: PromptElement[];
};

function extractMeaningfulElements(promptText: string): ExtractedElements {
  // Initialize result
  const result: ExtractedElements = {
    subjects: [],
    actions: [],
    attributes: [],
    context: []
  };

  // Improved pattern for extracting subjects - now handles articles better
  const actionSubjectPattern = /(?:can you|please|could you)?\s*([a-z]+(?:ing|ed)?)\s+(?:a|an|the)?\s*([a-z\s]+)(?:\s+with|\s+that|\s+for|\?|\.)/gi;
  const attributePattern = /(?:with|having|in|of)\s+([a-z\s]+)\s+(?:style|color|size|format|type|theme|mood)/gi;
  const subjectPattern = /(?:a|an|the|some|this|that)\s+([a-z]+(?:\s+[a-z]+){0,2})/gi;
  
  // Extract action-subject pairs with proper cleaning
  let match;
  while ((match = actionSubjectPattern.exec(promptText)) !== null) {
    if (match[1] && isActionWord(match[1])) {
      result.actions.push({
        text: cleanText(match[1].toLowerCase()),
        context: match[2] ? cleanText(match[2]) : '',
        importance: 3
      });
      
      if (match[2]) {
        result.subjects.push({
          text: cleanText(match[2].toLowerCase().trim()),
          context: match[1] ? cleanText(match[1]) : '',
          importance: 3
        });
      }
    }
  }
  
  // Extract attributes
  while ((match = attributePattern.exec(promptText)) !== null) {
    if (match[1]) {
      result.attributes.push({
        text: cleanText(match[1].toLowerCase().trim()),
        importance: 2
      });
    }
  }
  
  // Extract additional subjects
  while ((match = subjectPattern.exec(promptText)) !== null) {
    if (match[1] && !isCommonWord(match[1]) && !result.subjects.some(s => s.text === match[1].toLowerCase().trim())) {
      result.subjects.push({
        text: cleanText(match[1].toLowerCase().trim()),
        importance: 1
      });
    }
  }
  
  // If no actions were found, extract potential action words
  if (result.actions.length === 0) {
    const words = promptText.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (isActionWord(word) && word.length > 3) {
        result.actions.push({
          text: cleanText(word),
          importance: 1
        });
      }
    });
  }
  
  // If no subjects were found, find potential nouns
  if (result.subjects.length === 0) {
    const words = promptText.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if (words[i].length > 3 && !isCommonWord(words[i]) && !isActionWord(words[i])) {
        // Look for words that might be nouns (not in common words or action words)
        result.subjects.push({
          text: cleanText(words[i]),
          importance: 1
        });
      }
    }
  }
  
  // Extract context elements
  const contextWords = promptText.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !isCommonWord(word) && 
      !result.subjects.some(s => s.text === word) && 
      !result.actions.some(a => a.text === word) &&
      !result.attributes.some(a => a.text === word));
  
  contextWords.forEach(word => {
    result.context.push({
      text: cleanText(word),
      importance: 1
    });
  });
  
  // Deduplicate subjects
  result.subjects = deduplicate(result.subjects);
  result.actions = deduplicate(result.actions);
  result.attributes = deduplicate(result.attributes);
  
  return result;
}

function deduplicate(elements: PromptElement[]): PromptElement[] {
  const uniqueElements: PromptElement[] = [];
  const seenTexts = new Set<string>();
  
  elements.forEach(element => {
    if (!seenTexts.has(element.text)) {
      seenTexts.add(element.text);
      uniqueElements.push(element);
    }
  });
  
  return uniqueElements;
}

function generateContentSpecificQuestions(promptText: string, elements: ExtractedElements, userIntent: string): any[] {
  const questions = [];
  const subjects = elements.subjects.map(s => cleanSubjectText(s.text));
  const mainSubject = subjects.length > 0 ? subjects[0] : 'result';
  
  // Consider the full prompt context with proper subject handling
  if (promptText.includes('image') || promptText.includes('picture') || promptText.includes('photo')) {
    questions.push({
      text: `What style or visual aesthetic are you looking for?`,
      examples: ['minimalist', 'vibrant', 'retro', 'futuristic', 'realistic'],
      category: 'Style'
    });
    
    questions.push({
      text: `What mood or feeling should the ${mainSubject} convey?`,
      examples: ['calm', 'energetic', 'serious', 'playful', 'mysterious'],
      category: 'Mood'
    });
  } else if (promptText.includes('write') || promptText.includes('text') || promptText.includes('content')) {
    questions.push({
      text: `What tone of voice should be used for this content?`,
      examples: ['professional', 'conversational', 'academic', 'persuasive'],
      category: 'Tone'
    });
    
    questions.push({
      text: `Who is the target audience for this ${mainSubject}?`,
      examples: ['general public', 'professionals', 'beginners', 'experts in the field'],
      category: 'Audience'
    });
  } else {
    // General questions that work for most prompts
    questions.push({
      text: `What is your primary goal with this ${userIntent ? userIntent : 'request'}?`,
      examples: ['learning', 'creating something new', 'solving a problem', 'entertainment'],
      category: 'Purpose'
    });
    
    if (elements.actions.length > 0 && elements.subjects.length > 0) {
      questions.push({
        text: `What specific results are you hoping to achieve by ${elements.actions[0].text} the ${mainSubject}?`,
        examples: ['clarity', 'efficiency', 'visual appeal', 'better understanding'],
        category: 'Goals'
      });
    } else {
      questions.push({
        text: "What specific outcome are you looking for?",
        examples: ['detailed explanation', 'creative solution', 'step-by-step guide', 'quick answer'],
        category: 'Outcome'
      });
    }
  }
  
  return questions;
}

function generateEnhancedSubjectQuestions(subject: PromptElement, promptText: string, userIntent: string): any[] {
  const questions = [];
  const cleanedSubject = cleanSubjectText(subject.text);
  
  // Create questions that incorporate the cleaned subject
  questions.push({
    text: `What specific aspects of the ${cleanedSubject} are most important to you?`,
    examples: ['appearance', 'functionality', 'meaning', 'historical context'],
    category: 'Subject Focus'
  });
  
  // Add conditional questions based on subject type
  if (isPhysicalObject(cleanedSubject, promptText)) {
    questions.push({
      text: `What should the ${cleanedSubject} look like in terms of appearance?`,
      examples: ['modern', 'vintage', 'sleek', 'ornate', 'minimalist'],
      category: 'Appearance'
    });
  } else if (isConceptualSubject(cleanedSubject, promptText)) {
    questions.push({
      text: `How complex or detailed should the ${cleanedSubject} be?`,
      examples: ['simple and straightforward', 'moderately complex', 'highly detailed'],
      category: 'Complexity'
    });
  }
  
  return questions;
}

function generateEnhancedActionQuestions(action: PromptElement, promptText: string, subjects: PromptElement[]): any[] {
  const questions = [];
  const actionText = action.text;
  const relatedSubject = subjects.length > 0 ? cleanSubjectText(subjects[0].text) : '';
  
  // Create more contextual questions about the action
  questions.push({
    text: `How should the ${actionText} be performed${relatedSubject ? ` for the ${relatedSubject}` : ''}?`,
    examples: ['quickly', 'gradually', 'precisely', 'naturally'],
    category: 'Action Method'
  });
  
  if (isCreativeAction(actionText)) {
    questions.push({
      text: `What level of creativity or uniqueness do you want in the ${actionText} process?`,
      examples: ['very traditional', 'somewhat unique', 'completely original', 'experimental'],
      category: 'Creativity'
    });
  } else if (isAnalyticalAction(actionText)) {
    questions.push({
      text: `What depth of analysis do you need when ${actionText}${relatedSubject ? ` the ${relatedSubject}` : ''}?`,
      examples: ['basic overview', 'moderate detail', 'comprehensive analysis'],
      category: 'Depth'
    });
  }
  
  return questions;
}

function generateContextualAttributeQuestions(attribute: PromptElement, promptText: string, subjects: PromptElement[]): any[] {
  const questions = [];
  const attributeText = attribute.text;
  const relatedSubject = subjects.length > 0 ? cleanSubjectText(subjects[0].text) : 'result';
  
  questions.push({
    text: `How important is the ${attributeText} attribute for the ${relatedSubject}?`,
    examples: ['very important', 'somewhat important', 'nice to have', 'critical'],
    category: 'Attribute Importance'
  });
  
  questions.push({
    text: `Are there any specific aspects of ${attributeText} that should be emphasized?`,
    examples: ['subtlety', 'boldness', 'contrast', 'harmony', 'uniqueness'],
    category: 'Attribute Focus'
  });
  
  return questions;
}

function generateIntentBasedQuestions(userIntent: string, promptText: string): any[] {
  const questions = [];
  
  if (userIntent) {
    const cleanedIntent = userIntent.replace(/^n\s+/i, '');
    
    questions.push({
      text: `What's the main purpose of ${cleanedIntent}?`,
      examples: ['personal use', 'professional project', 'learning', 'entertainment'],
      category: 'Intent Purpose'
    });
    
    questions.push({
      text: `Are there any specific constraints or limitations for ${cleanedIntent}?`,
      examples: ['time constraints', 'technical limitations', 'skill level', 'resource availability'],
      category: 'Constraints'
    });
  }
  
  return questions;
}

function generateAdditionalQuestions(promptText: string, elements: ExtractedElements): any[] {
  const questions = [];
  
  // General questions that work for most prompts
  questions.push({
    text: "What level of detail are you expecting in the response?",
    examples: ['brief overview', 'moderate detail', 'comprehensive explanation'],
    category: 'Detail Level'
  });
  
  questions.push({
    text: "Is there any specific format you prefer for the information?",
    examples: ['bullet points', 'narrative', 'step-by-step', 'comparison'],
    category: 'Format'
  });
  
  questions.push({
    text: "Are there any particular examples or references you'd like incorporated?",
    examples: ['similar to X', 'avoiding approach Y', 'inspired by Z'],
    category: 'References'
  });
  
  return questions;
}

// Enhanced helper function for text cleaning
function cleanSubjectText(text: string): string {
  if (!text) return 'result';
  
  // Remove any leading articles and clean malformed text
  let cleanedText = text
    .replace(/^(a|an|the)\s+/i, '')  // Remove leading articles
    .replace(/\bn\b/g, '')           // Remove standalone 'n'
    .replace(/\s+/g, ' ')            // Normalize spaces
    .trim();
  
  // Fix "n + word" patterns that should be "a word" or "an word"
  cleanedText = cleanedText.replace(/^n\s+([aeiou])/i, 'an $1');  // n + vowel becomes "an + vowel"
  cleanedText = cleanedText.replace(/^n\s+([^aeiou])/i, 'a $1');  // n + consonant becomes "a + consonant"
  
  // Handle missing articles for subjects that need them
  if (needsArticle(cleanedText) && !hasArticle(cleanedText)) {
    if (/^[aeiou]/i.test(cleanedText)) {
      cleanedText = `an ${cleanedText}`;  // Add "an" before vowel sounds
    } else {
      cleanedText = `a ${cleanedText}`;   // Add "a" before consonant sounds
    }
  }
  
  return cleanedText || 'result';
}

// Detect if a subject needs an article
function needsArticle(text: string): boolean {
  // Most singular countable nouns need articles
  // This is a simplified check - in a real implementation you'd need more sophisticated rules
  const pluralEndings = ['s', 'es', 'ies'];
  const uncountableNouns = ['information', 'advice', 'news', 'furniture', 'luggage', 'equipment'];
  
  // Don't add articles to plural forms or uncountable nouns
  return !pluralEndings.some(ending => text.endsWith(ending)) && 
         !uncountableNouns.includes(text.toLowerCase());
}

// Check if text already has an article
function hasArticle(text: string): boolean {
  const articlePattern = /^(a|an|the)\s+/i;
  return articlePattern.test(text);
}

function cleanText(text: string): string {
  if (!text) return '';
  
  // Remove unwanted patterns
  text = text
    .replace(/\bn\b/g, '')     // Remove standalone 'n'
    .replace(/\s+/g, ' ')      // Normalize spaces
    .trim();
  
  // Fix "n + word" patterns
  text = text.replace(/n\s+([aeiou])/i, 'an $1');  // n + vowel becomes "an + vowel"
  text = text.replace(/n\s+([^aeiou])/i, 'a $1');  // n + consonant becomes "a + consonant"
  
  return text;
}

// Helper functions
function isCommonWord(word: string): boolean {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'as', 'from', 'that', 'this', 'these', 'those', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'can', 'could', 'will', 'would', 'should', 'may', 'might']);
  return commonWords.has(word.toLowerCase());
}

function isActionWord(word: string): boolean {
  const actionWords = new Set([
    'create', 'make', 'build', 'design', 'generate', 'show', 'display', 'write', 'draft',
    'develop', 'compose', 'analyze', 'explain', 'describe', 'draw', 'paint', 'sketch',
    'illustrate', 'demonstrate', 'present', 'organize', 'structure', 'produce', 'craft',
    'construct', 'arrange', 'format', 'optimize', 'enhance', 'improve', 'refine', 'edit',
    'revise', 'transform', 'convert', 'change', 'modify', 'adapt', 'adjust', 'implement',
    'code', 'program', 'script', 'model', 'render', 'animate', 'simulate', 'prepare',
    'plan', 'outline', 'summarize', 'condense', 'expand', 'explore', 'investigate',
    'research', 'study', 'learn', 'teach', 'instruct', 'guide', 'direct', 'manage',
    'lead', 'supervise', 'coordinate', 'facilitate', 'mediate', 'solve', 'resolve',
    'fix', 'repair', 'restore', 'reclaim', 'recover', 'retrieve', 'find', 'locate',
    'identify', 'recognize', 'detect', 'discover', 'uncover', 'reveal', 'expose',
    'display', 'showcase', 'highlight', 'emphasize', 'stress', 'prioritize', 'rank',
    'grade', 'evaluate', 'assess', 'measure', 'quantify', 'calculate', 'compute',
    'estimate', 'approximate', 'predict', 'forecast', 'project', 'envision', 'imagine'
  ]);
  
  // Also check for common verb endings
  return actionWords.has(word.toLowerCase()) || 
         word.endsWith('ing') || 
         word.endsWith('ate') ||
         word.endsWith('ize') ||
         word.endsWith('ise') ||
         word.endsWith('ify');
}

function isDescriptiveWord(word: string): boolean {
  return word.endsWith('ing') || word.endsWith('ed') || 
         word.endsWith('al') || word.endsWith('ive') || 
         word.endsWith('ous') || word.endsWith('ful') ||
         word.endsWith('ic') || word.endsWith('ent') ||
         word.endsWith('ant') || word.endsWith('able') ||
         word.endsWith('ible');
}

function isPhysicalObject(subject: string, context: string): boolean {
  // Check if subject is likely to be a physical object
  const physicalIndicators = ['size', 'color', 'shape', 'material', 'weight', 'dimensions', 'look', 'design', 'style', 'appearance'];
  
  return physicalIndicators.some(indicator => context.includes(`${subject} ${indicator}`) || context.includes(`${indicator} of ${subject}`));
}

function isConceptualSubject(subject: string, context: string): boolean {
  // Check if subject is likely to be a concept rather than physical
  const conceptualIndicators = ['idea', 'concept', 'theory', 'approach', 'strategy', 'plan', 'method', 'process', 'system', 'framework'];
  
  return conceptualIndicators.includes(subject) || 
         conceptualIndicators.some(indicator => context.includes(`${subject} ${indicator}`) || context.includes(`${indicator} of ${subject}`));
}

function isCreativeAction(action: string): boolean {
  const creativeActions = new Set(['create', 'design', 'develop', 'write', 'compose', 'draw', 'paint', 'sketch', 'illustrate', 'craft', 'build', 'make', 'generate']);
  return creativeActions.has(action.toLowerCase());
}

function isAnalyticalAction(action: string): boolean {
  const analyticalActions = new Set(['analyze', 'evaluate', 'assess', 'research', 'study', 'investigate', 'examine', 'review', 'interpret', 'understand']);
  return analyticalActions.has(action.toLowerCase());
}

// Export the function for generating contextual variables
export function generateContextualVariablesForPrompt(
  promptText: string,
  template: any,
  imageAnalysis: any = null,
  smartContext: any = null,
  isConcise: boolean = false
): Variable[] {
  const variables: Variable[] = [];
  let variableId = 1;

  // Extract meaningful elements from the prompt
  const elements = extractMeaningfulElements(promptText);
  
  // Generate variables for subjects (most important)
  elements.subjects.forEach(subject => {
    const raw = subject.text.trim();
    // skip filler/very short subjects
    if (raw.length < 3 || isCommonWord(raw)) return;
    const cleaned = cleanSubjectText(raw);
    // skip if cleaned ends up empty or blacklisted
    const key = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (STOP.has(key) || key === '') return;

    const variableName = capitalizeFirstLetter(cleaned) + (subject.context ? ` (${subject.context})` : '');
    variables.push({
      id: `var-${variableId++}`,
      name: variableName,
      value: '',
      isRelevant: true,
      category: 'Subject',
      code: toCamelCase(cleaned)
    });
  });
  
  // Generate variables for attributes
  elements.attributes.forEach(attribute => {
    if (attribute.text.length > 2 && !isCommonWord(attribute.text)) {
      const cleanedAttribute = cleanText(attribute.text);
      const variableName = capitalizeFirstLetter(cleanedAttribute) + ' Style';
      
      variables.push({
        id: `var-${variableId++}`,
        name: variableName,
        value: '',
        isRelevant: true,
        category: 'Attribute',
        code: toCamelCase(cleanedAttribute + 'Style')
      });
    }
  });
  
  // Extract potential style/format variables
  if (promptText.toLowerCase().includes('style') || promptText.toLowerCase().includes('format')) {
    variables.push({
      id: `var-${variableId++}`,
      name: 'Style Preference',
      value: '',
      isRelevant: true,
      category: 'Style',
      code: 'stylePreference'
    });
  }
  
  // Extract color-related variables
  if (promptText.toLowerCase().includes('color')) {
    variables.push({
      id: `var-${variableId++}`,
      name: 'Color Scheme',
      value: '',
      isRelevant: true,
      category: 'Color',
      code: 'colorScheme'
    });
  }
  
  // If we have too few variables, add some generic ones
  if (variables.length < 2) {
    variables.push({
      id: `var-${variableId++}`,
      name: 'Main Element',
      value: '',
      isRelevant: true,
      category: 'General',
      code: 'mainElement'
    });
    
    variables.push({
      id: `var-${variableId++}`,
      name: 'Style',
      value: '',
      isRelevant: true,
      category: 'General',
      code: 'style'
    });
  }

  // Final grammar validation for variable names
  const validatedVariables = variables.map(v => {
    // Fix any remaining grammatical issues in names
    v.name = fixGrammaticalErrors(v.name);
    // drop any whose value ended up as "yes" or repeats name
    if (v.value.toLowerCase() === 'yes' || v.value.toLowerCase() === v.name.toLowerCase()) {
      return null;
    }
    return v;
  });
  // filter out nulls
  return validatedVariables.filter((v): v is Variable => v !== null);
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toCamelCase(str: string): string {
  if (!str) return '';
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}
