import { Question, Variable } from '../types';

export function generateContextQuestionsForPrompt(
  promptText: string,
  template: any,
  smartContext: any = null,
  imageAnalysis: any = null,
  userIntent: string
): Question[] {
  const questions: Question[] = [];
  let questionId = 1;

  // Only process template pillars if they exist
  if (template?.pillars && Array.isArray(template.pillars)) {
    template.pillars.forEach((pillar: any) => {
      if (pillar && pillar.title) {
        // Extract keywords from the prompt for more specific questions
        const keywords = extractKeywords(promptText);
        
        // Generate pillar-specific questions that relate to the prompt
        const pillarQuestions = generatePillarSpecificQuestions(
          pillar,
          promptText,
          keywords,
          userIntent
        );

        // Add generated questions with proper metadata
        pillarQuestions.forEach(q => {
          questions.push({
            id: `q-${questionId++}`,
            text: q.text,
            answer: q.example || '', // Include example answer
            isRelevant: true,
            category: pillar.title,
            contextSource: 'prompt'
          });
        });
      }
    });
  }

  return questions;
}

// Helper function to extract meaningful keywords from the prompt
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

// Generate questions specific to a pillar and the user's prompt
function generatePillarSpecificQuestions(
  pillar: any,
  promptText: string,
  keywords: string[],
  userIntent: string
): Array<{ text: string; example: string }> {
  const questions: Array<{ text: string; example: string }> = [];
  
  // Use the pillar description and keywords to generate relevant questions
  const promptLines = promptText.split('\n').filter(line => line.trim());
  
  // Generate 2-3 questions per pillar based on the prompt content
  keywords.slice(0, 3).forEach(keyword => {
    const question = createContextualQuestion(
      pillar.title,
      pillar.description,
      keyword,
      userIntent
    );
    
    if (question) {
      questions.push(question);
    }
  });

  return questions;
}

function createContextualQuestion(
  pillarTitle: string,
  pillarDescription: string,
  keyword: string,
  userIntent: string
): { text: string; example: string } | null {
  // Create a question that combines the pillar focus with the specific keyword
  const questionContext = `${keyword} in the context of ${pillarTitle.toLowerCase()}`;
  
  // Generate a question specific to both the pillar and the keyword
  return {
    text: `How should ${questionContext} be handled to achieve your goal?`,
    example: `Example: The ${keyword} should be optimized for ${pillarTitle.toLowerCase()} by...`
  };
}

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

// Utility function to convert a string to camelCase
function toCamelCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}
