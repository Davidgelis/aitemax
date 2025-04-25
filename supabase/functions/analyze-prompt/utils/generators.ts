import { Question, Variable } from '../types.ts';

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

  // Extract key elements from the prompt
  const promptElements = extractKeyElements(promptText);
  console.log("Extracted elements:", promptElements);

  // Generate base contextual questions
  const baseQuestions = generateBaseContextualQuestions(promptText, promptElements);
  questions.push(...baseQuestions.map((q, index) => ({
    id: `q-${questionId++}`,
    text: q.text,
    answer: q.examples ? `E.g: ${q.examples.join(', ')}` : '',
    isRelevant: true,
    category: q.category || 'Context',
    contextSource: 'prompt'
  })));

  // Generate specific contextual questions for each subject
  promptElements.subjects.forEach(subject => {
    const subjectQuestions = generateSubjectQuestions(subject, promptText);
    questions.push(...subjectQuestions.map(q => ({
      id: `q-${questionId++}`,
      text: q.text,
      answer: q.examples ? `E.g: ${q.examples.join(', ')}` : '',
      isRelevant: true,
      category: q.category || 'Subject Details',
      contextSource: 'prompt'
    })));
  });

  // Generate action-based questions
  promptElements.actions.forEach(action => {
    const actionQuestions = generateActionQuestions(action, promptText);
    questions.push(...actionQuestions.map(q => ({
      id: `q-${questionId++}`,
      text: q.text,
      answer: q.examples ? `E.g: ${q.examples.join(', ')}` : '',
      isRelevant: true,
      category: 'Action Details',
      contextSource: 'prompt'
    })));
  });

  // Generate attribute-based questions
  promptElements.attributes.forEach(attribute => {
    const attributeQuestions = generateAttributeQuestions(attribute, promptText);
    questions.push(...attributeQuestions.map(q => ({
      id: `q-${questionId++}`,
      text: q.text,
      answer: q.examples ? `E.g: ${q.examples.join(', ')}` : '',
      isRelevant: true,
      category: 'Attributes',
      contextSource: 'prompt'
    })));
  });

  return questions;
}

function extractKeyElements(promptText: string): {
  subjects: string[];
  actions: string[];
  attributes: string[];
  context: string[];
} {
  const words = promptText.toLowerCase().split(/\s+/);
  
  const subjects = words.filter(word => 
    word.length > 2 && !isCommonWord(word) && isLikelySubject(word, promptText)
  );
  
  const actions = words.filter(word => 
    word.length > 3 && isActionWord(word) && !subjects.includes(word)
  );
  
  const attributes = words.filter(word =>
    word.length > 3 && isDescriptiveWord(word) && !subjects.includes(word) && !actions.includes(word)
  );
  
  const context = words.filter(word =>
    word.length > 3 && isContextualWord(word) && !subjects.includes(word) && 
    !actions.includes(word) && !attributes.includes(word)
  );

  return { subjects, actions, attributes, context };
}

function generateBaseContextualQuestions(promptText: string, elements: any): any[] {
  const questions = [];

  // Style and Tone Questions
  questions.push({
    text: "What style or tone should be used?",
    examples: ['professional', 'casual', 'formal', 'playful'],
    category: 'Style'
  });

  // Purpose Questions
  questions.push({
    text: "What is the main purpose or goal?",
    examples: ['inform', 'entertain', 'persuade', 'guide'],
    category: 'Purpose'
  });

  // Audience Questions
  questions.push({
    text: "Who is the target audience?",
    examples: ['general public', 'professionals', 'experts', 'beginners'],
    category: 'Audience'
  });

  // Context Questions
  if (elements.context.length > 0) {
    questions.push({
      text: "In what context should this be applied?",
      examples: ['business', 'personal', 'educational', 'creative'],
      category: 'Context'
    });
  }

  return questions;
}

function generateSubjectQuestions(subject: string, promptText: string): any[] {
  const questions = [];
  
  questions.push({
    text: `What specific characteristics of ${subject} should be emphasized?`,
    examples: ['size', 'color', 'shape', 'texture'],
    category: 'Characteristics'
  });

  questions.push({
    text: `How should ${subject} be presented or positioned?`,
    examples: ['prominently', 'subtly', 'in detail', 'abstractly'],
    category: 'Presentation'
  });

  return questions;
}

function generateActionQuestions(action: string, promptText: string): any[] {
  const questions = [];

  questions.push({
    text: `How should the ${action} be performed or executed?`,
    examples: ['quickly', 'gradually', 'precisely', 'naturally'],
    category: 'Execution'
  });

  questions.push({
    text: `What should be the intensity or level of ${action}?`,
    examples: ['subtle', 'moderate', 'intense', 'varying'],
    category: 'Intensity'
  });

  return questions;
}

function generateAttributeQuestions(attribute: string, promptText: string): any[] {
  const questions = [];

  questions.push({
    text: `How important is the ${attribute} in the overall context?`,
    examples: ['very important', 'moderate', 'subtle influence', 'critical'],
    category: 'Importance'
  });

  questions.push({
    text: `How should ${attribute} be incorporated or expressed?`,
    examples: ['explicitly', 'implicitly', 'throughout', 'in specific parts'],
    category: 'Integration'
  });

  return questions;
}

// Helper functions
function isCommonWord(word: string): boolean {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  return commonWords.has(word);
}

function isLikelySubject(word: string, context: string): boolean {
  return word.length > 2 && !isCommonWord(word) && 
         (context.includes(`the ${word}`) || context.includes(`a ${word}`));
}

function isActionWord(word: string): boolean {
  const actionWords = new Set([
    'create', 'make', 'build', 'design', 'generate', 'show', 'display',
    'develop', 'write', 'compose', 'analyze', 'explain', 'describe',
    'illustrate', 'demonstrate', 'present', 'organize', 'structure'
  ]);
  return actionWords.has(word) || word.endsWith('ing') || word.endsWith('ate');
}

function isDescriptiveWord(word: string): boolean {
  return word.endsWith('ing') || word.endsWith('ed') || 
         word.endsWith('al') || word.endsWith('ive') || 
         word.endsWith('ous') || word.endsWith('ful');
}

function isContextualWord(word: string): boolean {
  return word.length > 3 && !isCommonWord(word) && !isActionWord(word);
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

  // Extract key nouns and adjectives from the prompt
  const keywords = extractKeywords(promptText);

  // Generate variables based on keywords
  keywords.forEach(keyword => {
    const variableName = keyword;
    const variableValue = ''; // Initial value can be empty
    const variableCategory = 'General'; // Default category

    variables.push({
      id: `var-${variableId++}`,
      name: variableName,
      value: variableValue,
      isRelevant: true,
      category: variableCategory,
      code: toCamelCase(variableName) // Generate camelCase code
    });
  });

  return variables;
}

function toCamelCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

function extractKeywords(promptText: string): string[] {
  // Remove common words and extract key terms
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  return promptText
    .toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !commonWords.has(word) &&
      !word.match(/[0-9]/) // Exclude numbers
    );
}
