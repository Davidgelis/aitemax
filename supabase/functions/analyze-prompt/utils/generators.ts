
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
    console.log("Prompt text too short or empty, cannot generate specific questions");
    return [];
  }

  // Extract meaningful content from the prompt
  const promptKeywords = extractMeaningfulKeywords(promptText);
  const promptTopics = extractTopics(promptText);
  
  // Log extracted content for debugging
  console.log(`Extracted ${promptKeywords.length} keywords and ${promptTopics.length} topics from prompt`);
  
  if (promptKeywords.length === 0) {
    console.log("No meaningful keywords found in prompt");
    return [];
  }
  
  // Only process template pillars if they exist
  if (template?.pillars && Array.isArray(template.pillars)) {
    template.pillars.forEach((pillar: any) => {
      if (pillar && pillar.title) {
        // Score and select the most relevant keywords for this pillar
        const rankedKeywords = rankKeywordsByPillarRelevance(promptKeywords, pillar.title, promptText);
        
        if (rankedKeywords.length > 0) {
          // Generate questions specific to this pillar's keywords
          const pillarQuestions = generatePillarSpecificQuestions(
            pillar,
            rankedKeywords,
            promptText,
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
      }
    });
  }

  return questions;
}

// Extract meaningful keywords that represent concepts, actions, or entities from the prompt
function extractMeaningfulKeywords(promptText: string): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 
    'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 
    'out', 'from', 'up', 'about', 'during', 'before', 'i', 'me', 'my', 'myself', 
    'we', 'our', 'ours', 'us', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 
    'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'theirs', 'this', 'that', 
    'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would', 'will', 
    'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ought'
  ]);
  
  // Extract words, focusing on longer ones that are likely meaningful
  const words = promptText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && 
      !commonWords.has(word) &&
      !word.match(/^\d+$/)  // Exclude pure numbers
    );
  
  // Extract phrases (2-3 word combinations) that might represent concepts
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (!commonWords.has(words[i]) && !commonWords.has(words[i+1])) {
      phrases.push(`${words[i]} ${words[i+1]}`);
    }
    
    if (i < words.length - 2 && !commonWords.has(words[i+2])) {
      phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }
  }
  
  // Combine individual words with meaningful phrases
  const uniqueKeywords = new Set([...words, ...phrases]);
  return Array.from(uniqueKeywords);
}

// Extract main topics or subjects from the prompt
function extractTopics(promptText: string): string[] {
  // Simple topic extraction based on capitalized words and noun phrases
  const topics: string[] = [];
  
  // Look for capitalized words that might indicate proper nouns/topics
  const capitalizedPattern = /\b[A-Z][a-z]{2,}\b/g;
  let match;
  while ((match = capitalizedPattern.exec(promptText)) !== null) {
    topics.push(match[0]);
  }
  
  // Look for potential noun phrases (adjective + noun patterns)
  const nounPhrasePattern = /\b([a-z]+\s+){0,2}(app|website|platform|system|feature|design|page|function|component|service|product|tool|dashboard|interface|api)\b/gi;
  while ((match = nounPhrasePattern.exec(promptText)) !== null) {
    topics.push(match[0]);
  }
  
  // Deduplicate
  return Array.from(new Set(topics));
}

// Rank keywords based on their relevance to the pillar
function rankKeywordsByPillarRelevance(keywords: string[], pillarTitle: string, promptText: string): string[] {
  const scoredKeywords = keywords.map(keyword => {
    let score = 0;
    
    // ONLY consider keywords that actually appear in the prompt text
    const keywordRegex = new RegExp("\\b" + keyword + "\\b", 'gi');
    const occurrences = (promptText.match(keywordRegex) || []).length;
    
    // If keyword doesn't appear in prompt text, give it a negative score
    if (occurrences === 0) {
      score = -100; // This ensures it won't be used
    } else {
      // Score based on occurrences
      score += occurrences * 2;
      
      // Higher score if keyword is related to pillar
      if (pillarTitle.toLowerCase().includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(pillarTitle.toLowerCase())) {
        score += 3;
      }
      
      // Higher score for action verbs common in development
      if (keyword.match(/(creat|build|design|develop|implement|add|make|generat|integrat|deploy)/i)) {
        score += 2;
      }
      
      // Higher score for words that appear near the pillar title in the prompt
      const pillarProximity = promptText.toLowerCase().indexOf(pillarTitle.toLowerCase());
      const keywordPosition = promptText.toLowerCase().indexOf(keyword.toLowerCase());
      if (pillarProximity >= 0 && keywordPosition >= 0) {
        const distance = Math.abs(pillarProximity - keywordPosition);
        if (distance < 50) score += (50 - distance) / 10; // Closer = higher score
      }
    }
    
    return { keyword, score };
  });
  
  // Sort by score and return just the keywords, filtering out any with negative scores
  return scoredKeywords
    .filter(k => k.score > 0) // Only include keywords that actually appear in the prompt
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)  // Take top 5 most relevant keywords
    .map(k => k.keyword);
}

// Generate focused questions for each pillar using prompt-specific keywords
function generatePillarSpecificQuestions(
  pillar: any,
  keywords: string[],
  promptText: string,
  questionsPerPillar: number
): Array<{ text: string; example: string }> {
  const questions: Array<{ text: string; example: string }> = [];
  
  // Create questions using the top keywords, but ensure uniqueness
  const usedKeywords = new Set<string>();
  
  for (const keyword of keywords) {
    // Skip if we have enough questions or if keyword was already used
    if (questions.length >= questionsPerPillar || usedKeywords.has(keyword)) {
      continue;
    }
    
    // Double check keyword is actually in the prompt with a more strict check
    const keywordRegex = new RegExp("\\b" + keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "\\b", 'i');
    if (keywordRegex.test(promptText)) {
      const questionText = `How should ${keyword} in the context of ${pillar.title.toLowerCase()} be handled to achieve your goal?`;
      
      // Generate multiple example points
      const examplePoints = generateExamplePoints(keyword, pillar.title, promptText);
      
      questions.push({
        text: questionText,
        example: `E.g: ${examplePoints.join(', ')}`
      });
      
      usedKeywords.add(keyword);
    }
  }
  
  // If we still need more questions, try with more general prompt-specific questions
  if (questions.length < questionsPerPillar) {
    const remainingKeywordsNeeded = questionsPerPillar - questions.length;
    
    // Use any additional keywords that might be in the prompt but weren't selected earlier
    const allKeywords = extractMeaningfulKeywords(promptText);
    const unusedKeywords = allKeywords.filter(k => !usedKeywords.has(k));
    
    for (const keyword of unusedKeywords) {
      if (questions.length >= questionsPerPillar) break;
      
      // Double check keyword is actually in the prompt
      const keywordRegex = new RegExp("\\b" + keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "\\b", 'i');
      if (keywordRegex.test(promptText)) {
        const questionText = `How should ${keyword} in the context of ${pillar.title.toLowerCase()} be handled to achieve your goal?`;
        
        // Generate example points
        const examplePoints = generateExamplePoints(keyword, pillar.title, promptText);
        
        questions.push({
          text: questionText,
          example: `E.g: ${examplePoints.join(', ')}`
        });
        
        usedKeywords.add(keyword);
      }
    }
  }

  return questions;
}

// Generate concise example points relevant to the keyword and pillar
function generateExamplePoints(keyword: string, pillarTitle: string, promptText: string): string[] {
  // Base examples on prompt content and keyword context
  const examples: string[] = [];
  
  // Look for action verbs in the prompt
  const actionVerbRegex = /(create|build|design|develop|implement|add|make|generate|optimize|enhance|improve|integrate)/gi;
  const actionVerbs = [];
  let match;
  
  while ((match = actionVerbRegex.exec(promptText)) !== null) {
    actionVerbs.push(match[0].toLowerCase());
  }
  
  // Use found action verbs, or defaults if none found
  const verbs = actionVerbs.length > 0 ? 
    [...new Set(actionVerbs)] : 
    ['Define', 'Plan', 'Implement', 'Test'];
  
  // Generate specific examples
  if (pillarTitle.toLowerCase().includes('design')) {
    examples.push(`${verbs[0] || 'Create'} ${keyword} visual elements`);
    examples.push(`Ensure ${keyword} matches brand identity`);
    examples.push(`Plan ${keyword} user experience flow`);
  } 
  else if (pillarTitle.toLowerCase().includes('function') || pillarTitle.toLowerCase().includes('task')) {
    examples.push(`${verbs[0] || 'Define'} ${keyword} requirements`);
    examples.push(`${verbs[1] || 'Implement'} ${keyword} functionality`);
    examples.push(`Test ${keyword} performance`);
  }
  else if (pillarTitle.toLowerCase().includes('content')) {
    examples.push(`Structure ${keyword} information hierarchy`);
    examples.push(`Create ${keyword} copy guidelines`);
    examples.push(`Develop ${keyword} content strategy`);
  }
  else {
    // Default examples based on verbs found in the prompt
    for (let i = 0; i < Math.min(verbs.length, 3); i++) {
      examples.push(`${verbs[i]} ${keyword} ${pillarTitle.toLowerCase()}`);
    }
    
    // Add one more example if we don't have enough
    if (examples.length < 3) {
      examples.push(`Review ${keyword} results`);
    }
  }
  
  return examples.slice(0, 4); // Limit to 4 examples
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
