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

  // Only process template pillars if they exist
  if (template?.pillars && Array.isArray(template.pillars)) {
    template.pillars.forEach((pillar: any) => {
      if (pillar && pillar.title) {
        // Extract keywords from the prompt for more specific questions
        const keywords = extractKeywordsWithContext(promptText, pillar.title);
        
        // Generate questions specific to this pillar's keywords
        const pillarQuestions = generatePillarSpecificQuestions(
          pillar,
          keywords,
          userIntent,
          3 // Generate top 3 questions per pillar
        );

        // Add generated questions with proper metadata
        pillarQuestions.forEach(q => {
          questions.push({
            id: `q-${questionId++}`,
            text: q.text,
            answer: q.example || '',
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

// Enhanced keyword extraction that considers pillar context
function extractKeywordsWithContext(promptText: string, pillarTitle: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  
  // Get action words and nouns from the prompt
  const words = promptText
    .toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !commonWords.has(word) &&
      !word.match(/[0-9]/)
    );

  // Score keywords based on relevance to pillar
  const scoredKeywords = words.map(word => ({
    word,
    score: getKeywordRelevanceScore(word, pillarTitle)
  }));

  // Return top keywords sorted by relevance score
  return scoredKeywords
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(k => k.word);
}

// Score keyword relevance to pillar context
function getKeywordRelevanceScore(word: string, pillarTitle: string): number {
  let score = 1;
  
  // Higher score if word relates to pillar title
  if (pillarTitle.toLowerCase().includes(word) || 
      word.includes(pillarTitle.toLowerCase())) {
    score += 3;
  }
  
  // Higher score for action verbs
  if (word.match(/(create|build|design|develop|implement|add|make)/)) {
    score += 2;
  }
  
  return score;
}

// Generate focused questions for each pillar
function generatePillarSpecificQuestions(
  pillar: any,
  keywords: string[],
  userIntent: string,
  questionsPerPillar: number
): Array<{ text: string; example: string }> {
  const questions: Array<{ text: string; example: string }> = [];
  
  // Create questions using the top keywords
  keywords.slice(0, questionsPerPillar).forEach(keyword => {
    const questionText = `How should ${keyword} in the context of ${pillar.title.toLowerCase()} be handled to achieve your goal?`;
    
    // Generate multiple example points
    const examplePoints = generateExamplePoints(keyword, pillar.title, userIntent);
    
    questions.push({
      text: questionText,
      example: `E.g: ${examplePoints.join(', ')}`
    });
  });

  return questions;
}

// Generate concise example points
function generateExamplePoints(keyword: string, pillarTitle: string, userIntent: string): string[] {
  return [
    `Define ${keyword} requirements`,
    `Plan ${keyword} implementation`,
    `Test ${keyword} functionality`,
    `Review ${keyword} results`
  ];
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
