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
  const promptWords = promptText.toLowerCase().split(/\s+/);
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
    // Track keywords already used to avoid duplicates across pillars
    const usedKeywordsGlobally = new Set<string>();
    
    template.pillars.forEach((pillar: any) => {
      if (pillar && pillar.title) {
        // For each pillar, get a set of unique prompt-specific keywords
        const uniqueKeywordsForPillar = promptKeywords
          .filter(keyword => 
            // Ensure keyword actually appears in the prompt text (strict checking)
            promptText.toLowerCase().includes(keyword.toLowerCase()) && 
            // Don't reuse keywords across pillars
            !usedKeywordsGlobally.has(keyword)
          )
          .slice(0, 3); // Limit to 3 keywords per pillar
        
        if (uniqueKeywordsForPillar.length > 0) {
          // Add these keywords to the global used set
          uniqueKeywordsForPillar.forEach(keyword => usedKeywordsGlobally.add(keyword));
          
          // Generate questions using only these verified prompt-specific keywords
          uniqueKeywordsForPillar.forEach(keyword => {
            // Double verify the keyword is in the prompt with exact matching
            if (verifyKeywordInPrompt(keyword, promptText)) {
              const questionText = `How should ${keyword} in the context of ${pillar.title.toLowerCase()} be handled to achieve your goal?`;
              const examplePoints = generatePromptSpecificExamples(keyword, pillar.title, promptText);
              
              questions.push({
                id: `q-${questionId++}`,
                text: questionText,
                answer: `E.g: ${examplePoints.join(', ')}`,
                isRelevant: true,
                category: pillar.title,
                contextSource: 'prompt'
              });
            }
          });
        }
      }
    });
    
    // If we didn't generate enough questions, try a different approach with key phrases
    if (questions.length < template.pillars.length * 2) {
      const keyPhrases = extractKeyPhrases(promptText);
      console.log(`Generated ${keyPhrases.length} key phrases from prompt`);
      
      let additionalQuestionsAdded = 0;
      
      template.pillars.forEach((pillar: any) => {
        if (pillar && pillar.title) {
          // How many more questions we need for this pillar
          const questionsForThisPillar = questions.filter(q => q.category === pillar.title).length;
          const neededQuestions = 3 - questionsForThisPillar;
          
          if (neededQuestions > 0) {
            // Find phrases not already used in questions
            const availablePhrases = keyPhrases.filter(phrase => 
              !questions.some(q => q.text.includes(phrase)) &&
              verifyKeywordInPrompt(phrase, promptText)
            );
            
            // Take what we need
            const phrasesToUse = availablePhrases.slice(0, neededQuestions);
            
            phrasesToUse.forEach(phrase => {
              const questionText = `How should ${phrase} in the context of ${pillar.title.toLowerCase()} be handled to achieve your goal?`;
              const examplePoints = generatePromptSpecificExamples(phrase, pillar.title, promptText);
              
              questions.push({
                id: `q-${questionId++}`,
                text: questionText,
                answer: `E.g: ${examplePoints.join(', ')}`,
                isRelevant: true,
                category: pillar.title,
                contextSource: 'prompt'
              });
              
              additionalQuestionsAdded++;
            });
          }
        }
      });
      
      console.log(`Added ${additionalQuestionsAdded} additional questions using key phrases`);
    }
  }

  // Final verification pass to ensure all questions reference prompt content
  const verifiedQuestions = questions.filter(question => {
    const isPromptSpecific = isQuestionPromptSpecific(question.text, promptText);
    if (!isPromptSpecific) {
      console.log(`Filtering out non-prompt-specific question: "${question.text}"`);
    }
    return isPromptSpecific;
  });

  console.log(`Generated ${questions.length} questions, ${verifiedQuestions.length} verified as prompt-specific`);
  return verifiedQuestions;
}

// Verify a keyword actually appears in the prompt (as a whole word, not part of another word)
function verifyKeywordInPrompt(keyword: string, promptText: string): boolean {
  // Clean up the keyword and prompt for comparison
  const cleanKeyword = keyword.toLowerCase().replace(/[^\w\s]/g, '');
  const cleanPrompt = promptText.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Check if the keyword appears as a whole word or exact phrase
  const keywordRegex = new RegExp(`\\b${cleanKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
  return keywordRegex.test(cleanPrompt);
}

// Check if a question is properly specific to the prompt
function isQuestionPromptSpecific(questionText: string, promptText: string): boolean {
  // Extract the subject of the question (usually after "How should" and before "in the context of")
  const subjectMatch = questionText.match(/How should\s+([^]+?)\s+in the context of/i);
  if (!subjectMatch || !subjectMatch[1]) return false;
  
  const subject = subjectMatch[1].toLowerCase();
  
  // Check if this subject actually appears in the prompt
  return verifyKeywordInPrompt(subject, promptText);
}

// Extract key phrases that might represent important concepts in the prompt
function extractKeyPhrases(promptText: string): string[] {
  const phrases = [];
  const words = promptText.toLowerCase().split(/\s+/);
  
  // Look for noun + adjective patterns and other common phrase patterns
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length > 2 && words[i+1].length > 2) { // Both words must be substantial
      phrases.push(`${words[i]} ${words[i+1]}`);
    }
  }
  
  // Also extract any capitalized phrases (proper nouns)
  const capitalizedPhraseRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  const capitalizedMatches = promptText.match(capitalizedPhraseRegex) || [];
  capitalizedMatches.forEach(match => phrases.push(match.toLowerCase()));
  
  // Deduplicate and return
  return [...new Set(phrases)];
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
    'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ought', 'how', 'context'
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
  
  // Find most relevant individual words (likely nouns and verbs)
  const wordScore = new Map<string, number>();
  words.forEach(word => {
    // Score based on word characteristics
    let score = word.length; // Longer words often more meaningful
    
    // Higher score for capitalized words in original text (likely nouns)
    if (promptText.match(new RegExp(`\\b${word}\\b`, 'i'))) {
      if (promptText.match(new RegExp(`\\b${word[0].toUpperCase()}${word.slice(1)}\\b`))) {
        score += 3;
      }
    }
    
    // Higher score for words that appear multiple times
    const occurrences = promptText.toLowerCase().split(word).length - 1;
    score += occurrences;
    
    wordScore.set(word, score);
  });
  
  // Sort words by score and take top ones
  const topWords = Array.from(wordScore.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
  
  // Combine individual words with meaningful phrases, but verify each actually appears in the text
  const candidates = [...topWords, ...phrases];
  const verifiedKeywords = candidates.filter(keyword => 
    verifyKeywordInPrompt(keyword, promptText)
  );
  
  // Deduplicate and return
  return [...new Set(verifiedKeywords)];
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

// Generate examples that are specifically relevant to the keyword and prompt content
function generatePromptSpecificExamples(keyword: string, pillarTitle: string, promptText: string): string[] {
  const examples: string[] = [];
  
  // Extract action verbs from the prompt to make examples more relevant
  const actionVerbRegex = /(create|build|design|develop|implement|add|make|generate|optimize|enhance|improve|integrate)/gi;
  const actionVerbs = [];
  let match;
  
  while ((match = actionVerbRegex.exec(promptText)) !== null) {
    actionVerbs.push(match[0].toLowerCase());
  }
  
  // Use found action verbs, or defaults if none found
  const verbs = actionVerbs.length > 0 ? 
    [...new Set(actionVerbs)] : 
    ['Define', 'Create', 'Implement'];
  
  // Create examples using prompt-specific content when possible
  // Extract nouns from the prompt to use in examples
  const promptNouns = promptText.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !actionVerbs.includes(word.toLowerCase()));
  
  // Use the most relevant verb + keyword combinations
  if (verbs.length > 0 && promptNouns.length > 0) {
    // Use first verb with keyword directly
    examples.push(`${verbs[0]} ${keyword}`);
    
    // Use second verb (if available) with keyword and context from prompt
    if (verbs.length > 1) {
      const contextNoun = promptNouns.find(noun => noun !== keyword) || pillarTitle.toLowerCase();
      examples.push(`${verbs[1]} ${keyword} for ${contextNoun}`);
    }
    
    // Add a third example with more context
    examples.push(`Ensure ${keyword} aligns with ${pillarTitle.toLowerCase()} requirements`);
  } else {
    // Fallback examples if we couldn't extract good verbs/nouns
    examples.push(`Define ${keyword} requirements`);
    examples.push(`Implement ${keyword} in ${pillarTitle.toLowerCase()}`);
    examples.push(`Optimize ${keyword} performance`);
  }
  
  return examples;
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
