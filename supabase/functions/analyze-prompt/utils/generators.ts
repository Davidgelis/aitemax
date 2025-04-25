
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

  // Process template pillars if they exist
  if (template?.pillars && Array.isArray(template.pillars)) {
    template.pillars.forEach((pillar: any) => {
      if (!pillar || !pillar.title) return;

      // Generate contextual questions based on prompt elements
      const contextQuestions = generateContextualQuestions(promptElements, pillar, promptText);
      
      contextQuestions.forEach(question => {
        if (isQuestionValueAdding(question, questions, promptText)) {
          questions.push({
            id: `q-${questionId++}`,
            text: question.text,
            answer: question.examples ? `E.g: ${question.examples.join(', ')}` : '',
            isRelevant: true,
            category: pillar.title,
            contextSource: 'prompt'
          });
        }
      });
    });
  }

  return questions;
}

interface PromptElements {
  subjects: string[];
  actions: string[];
  attributes: string[];
  context: string[];
}

function extractKeyElements(promptText: string): PromptElements {
  const words = promptText.toLowerCase().split(/\s+/);
  
  // Improved keyword extraction using natural language patterns
  const subjects = words.filter(word => 
    word.length > 2 && !isCommonWord(word) && isLikelySubject(word, promptText)
  );
  
  const actions = words.filter(word => 
    isActionWord(word) && !subjects.includes(word)
  );
  
  const attributes = words.filter(word =>
    isDescriptiveWord(word) && !subjects.includes(word) && !actions.includes(word)
  );
  
  const context = words.filter(word =>
    isContextualWord(word) && !subjects.includes(word) && 
    !actions.includes(word) && !attributes.includes(word)
  );

  return { subjects, actions, attributes, context };
}

interface ContextualQuestion {
  text: string;
  examples: string[];
}

function generateContextualQuestions(
  elements: PromptElements,
  pillar: any,
  originalPrompt: string
): ContextualQuestion[] {
  const questions: ContextualQuestion[] = [];
  
  // Generate questions based on missing context
  if (elements.subjects.length > 0) {
    elements.subjects.forEach(subject => {
      if (!hasDetailedAttributes(subject, originalPrompt)) {
        const question = generateDetailQuestion(subject, pillar, originalPrompt);
        if (question) questions.push(question);
      }
    });
  }

  // Generate questions about environmental/contextual details
  if (elements.actions.length > 0) {
    elements.actions.forEach(action => {
      if (!hasActionContext(action, originalPrompt)) {
        const question = generateActionContextQuestion(action, pillar, originalPrompt);
        if (question) questions.push(question);
      }
    });
  }

  return questions;
}

function generateDetailQuestion(subject: string, pillar: any, prompt: string): ContextualQuestion | null {
  // Generate specific questions based on the subject and pillar
  const questionTypes = {
    Appearance: {
      text: `What specific details or characteristics of the ${subject} should be emphasized?`,
      examples: generateSpecificExamples(subject, 'appearance', prompt)
    },
    Setting: {
      text: `In what setting or environment should the ${subject} be placed?`,
      examples: generateSpecificExamples(subject, 'setting', prompt)
    },
    Action: {
      text: `How exactly should the ${subject} be positioned or what action should it be performing?`,
      examples: generateSpecificExamples(subject, 'action', prompt)
    }
  };

  const questionType = determineQuestionType(pillar, subject);
  return questionTypes[questionType] || null;
}

function generateActionContextQuestion(action: string, pillar: any, prompt: string): ContextualQuestion | null {
  return {
    text: `How should the ${action} be specifically executed or presented?`,
    examples: generateSpecificExamples(action, 'execution', prompt)
  };
}

function generateSpecificExamples(keyword: string, type: string, prompt: string): string[] {
  // Generate contextually relevant examples based on the keyword and type
  const examples: string[] = [];
  const promptContext = extractPromptContext(prompt);
  
  switch (type) {
    case 'appearance':
      examples.push(...generateAppearanceExamples(keyword, promptContext));
      break;
    case 'setting':
      examples.push(...generateSettingExamples(keyword, promptContext));
      break;
    case 'action':
      examples.push(...generateActionExamples(keyword, promptContext));
      break;
    case 'execution':
      examples.push(...generateExecutionExamples(keyword, promptContext));
      break;
  }

  return examples.slice(0, 3); // Return top 3 most relevant examples
}

// Helper functions
function isCommonWord(word: string): boolean {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  return commonWords.has(word);
}

function isLikelySubject(word: string, context: string): boolean {
  // Implement natural language processing patterns to identify subjects
  return word.length > 2 && !isCommonWord(word) && 
         (context.includes(`the ${word}`) || context.includes(`a ${word}`));
}

function isActionWord(word: string): boolean {
  // Add common action words and their variations
  const actionWords = new Set(['create', 'make', 'build', 'design', 'generate', 'show', 'display']);
  return actionWords.has(word);
}

function isDescriptiveWord(word: string): boolean {
  // Check if the word is likely an adjective or descriptor
  return word.endsWith('ing') || word.endsWith('ed') || word.endsWith('al');
}

function isContextualWord(word: string): boolean {
  // Identify words that provide context (time, place, manner)
  return word.length > 3 && !isCommonWord(word) && !isActionWord(word);
}

function hasDetailedAttributes(subject: string, prompt: string): boolean {
  // Check if the subject already has detailed attributes in the prompt
  const subjectPattern = new RegExp(`(${subject}\\s+[\\w\\s]+)|([\\w\\s]+\\s+${subject})`, 'i');
  return subjectPattern.test(prompt);
}

function hasActionContext(action: string, prompt: string): boolean {
  // Check if the action already has context in the prompt
  const actionPattern = new RegExp(`${action}\\s+[\\w\\s]+`, 'i');
  return actionPattern.test(prompt);
}

function determineQuestionType(pillar: any, subject: string): string {
  // Map pillar types to question types based on context
  const pillarTitle = pillar.title.toLowerCase();
  if (pillarTitle.includes('visual') || pillarTitle.includes('appearance')) return 'Appearance';
  if (pillarTitle.includes('environment') || pillarTitle.includes('setting')) return 'Setting';
  return 'Action';
}

function extractPromptContext(prompt: string): string[] {
  // Extract key contextual phrases from the prompt
  return prompt.toLowerCase()
    .split(/[.,!?]/)
    .map(phrase => phrase.trim())
    .filter(phrase => phrase.length > 0);
}

function generateAppearanceExamples(keyword: string, context: string[]): string[] {
  // Generate specific appearance-related examples based on context
  const examples: string[] = [];
  const qualities = extractQualitiesFromContext(context);
  qualities.forEach(quality => {
    examples.push(`${quality} ${keyword}`);
  });
  return examples;
}

function generateSettingExamples(keyword: string, context: string[]): string[] {
  // Generate setting-specific examples based on context
  const examples: string[] = [];
  const settings = extractSettingsFromContext(context);
  settings.forEach(setting => {
    examples.push(`${keyword} in ${setting}`);
  });
  return examples;
}

function generateActionExamples(keyword: string, context: string[]): string[] {
  // Generate action-specific examples based on context
  const examples: string[] = [];
  const actions = extractActionsFromContext(context);
  actions.forEach(action => {
    examples.push(`${keyword} ${action}`);
  });
  return examples;
}

function generateExecutionExamples(keyword: string, context: string[]): string[] {
  // Generate execution-specific examples based on context
  const examples: string[] = [];
  const executions = extractExecutionsFromContext(context);
  executions.forEach(execution => {
    examples.push(`${keyword} ${execution}`);
  });
  return examples;
}

function extractQualitiesFromContext(context: string[]): string[] {
  // Extract quality-related words from context
  return context
    .flatMap(phrase => phrase.split(' '))
    .filter(word => isQualityWord(word));
}

function extractSettingsFromContext(context: string[]): string[] {
  // Extract setting-related phrases from context
  return context
    .filter(phrase => isSettingPhrase(phrase));
}

function extractActionsFromContext(context: string[]): string[] {
  // Extract action-related phrases from context
  return context
    .filter(phrase => isActionPhrase(phrase));
}

function extractExecutionsFromContext(context: string[]): string[] {
  // Extract execution-related phrases from context
  return context
    .filter(phrase => isExecutionPhrase(phrase));
}

function isQualityWord(word: string): boolean {
  return word.length > 3 && !isCommonWord(word);
}

function isSettingPhrase(phrase: string): boolean {
  return phrase.includes('in') || phrase.includes('at') || phrase.includes('on');
}

function isActionPhrase(phrase: string): boolean {
  return phrase.includes('ing') || phrase.includes('ed');
}

function isExecutionPhrase(phrase: string): boolean {
  return phrase.length > 5 && (phrase.includes('with') || phrase.includes('using'));
}

function isQuestionValueAdding(
  newQuestion: ContextualQuestion,
  existingQuestions: Question[],
  promptText: string
): boolean {
  // Check if the question is truly adding value and isn't redundant
  const isUnique = !existingQuestions.some(q => 
    q.text.toLowerCase().includes(newQuestion.text.toLowerCase()) ||
    newQuestion.text.toLowerCase().includes(q.text.toLowerCase())
  );

  const isPromptSpecific = promptText.toLowerCase().split(' ').some(word =>
    newQuestion.text.toLowerCase().includes(word) && word.length > 3
  );

  return isUnique && isPromptSpecific;
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
