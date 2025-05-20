
import { Question, Variable } from '../types.ts';

export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Starting question extraction with enhanced context awareness");
  
  try {
    try {
      const parsedResponse = JSON.parse(aiResponse);
      console.log("Successfully parsed JSON response");
      
      if (Array.isArray(parsedResponse.questions)) {
        console.log(`Found ${parsedResponse.questions.length} questions in JSON`);
        
        return parsedResponse.questions.map((q: any, index: number) => {
          let text = q.text || '';
          
          // Add examples if they're not already present
          if (!text.includes('(') && !text.includes(')') && !text.includes('?')) {
            text += '?'; // Ensure it's a question
          }
          
          if (!text.includes('(') && !text.includes(')') && !text.includes('example')) {
            const examples = generateContextSpecificExamples(text, originalPrompt);
            if (examples) {
              text += ` (${examples})`;
            }
          }
          
          // Simplify technical terms in the question and make it more user-friendly
          text = simplifyTechnicalTerms(text);
          
          return {
            id: q.id || `q-${index + 1}`,
            text,
            answer: q.answer || '',
            isRelevant: typeof q.isRelevant === 'boolean' ? q.isRelevant : true,
            category: q.category || 'General',
            contextSource: q.contextSource || 'prompt'
          };
        });
      }
      console.log("No questions array found in JSON response");
      return [];
    } catch (jsonError) {
      console.error("JSON parsing failed:", jsonError);
      return [];
    }
  } catch (error) {
    console.error("Error in question extraction:", error);
    return [];
  }
}

function generateContextSpecificExamples(question: string, originalPrompt: string): string {
  // Lower case both for matching
  const promptLower = originalPrompt.toLowerCase();
  const questionLower = question.toLowerCase();
  
  // Extract context clues from the prompt
  const colorMatch = promptLower.match(/(?:color|colou?r)s?\s+(?:like|such as)?\s*([a-z\s,]+)/);
  const styleMatch = promptLower.match(/(?:style|theme|design)s?\s+(?:like|such as)?\s*([a-z\s,]+)/);
  const sizeMatch = promptLower.match(/(?:size|dimension)s?\s+(?:like|such as)?\s*([a-z\s,]+)/);
  
  // Match question to appropriate examples
  if (questionLower.includes('color')) {
    if (colorMatch && colorMatch[1]) {
      return `like ${colorMatch[1].trim()} or other colors`;
    }
    return 'like "vibrant blue", "soft pastel tones", "high contrast"';
  } else if (questionLower.includes('style') || questionLower.includes('theme')) {
    if (styleMatch && styleMatch[1]) {
      return `like ${styleMatch[1].trim()} or similar styles`;
    }
    return 'like "modern and sleek", "warm and cozy", "professional"';
  } else if (questionLower.includes('size')) {
    if (sizeMatch && sizeMatch[1]) {
      return `like ${sizeMatch[1].trim()} or other dimensions`;
    }
    return 'like "compact", "full-screen", "mobile-friendly"';
  } else if (questionLower.includes('tone') || questionLower.includes('voice')) {
    return 'like "formal", "conversational", "technical", "friendly"';
  } else if (questionLower.includes('audience') || questionLower.includes('user')) {
    return 'like "general public", "professionals", "beginners", "tech-savvy users"';
  } else if (questionLower.includes('purpose') || questionLower.includes('goal')) {
    return 'like "to inform", "to persuade", "to entertain", "to guide"';
  } else if (questionLower.includes('detail') || questionLower.includes('specific')) {
    return 'like "essential features only", "comprehensive detail", "focus on X aspect"';
  }
  
  return '';
}

function simplifyTechnicalTerms(text: string): string {
  const simplifications: Record<string, string> = {
    'rgb': 'color',
    'resolution': 'image quality',
    'opacity': 'see-through level',
    'gradient': 'color blend',
    'dimensions': 'size',
    'parameters': 'settings',
    'configuration': 'setup',
    'interface': 'screen layout',
    'functionality': 'features',
    'implementation': 'creation',
    'utilize': 'use',
    'leverage': 'use',
    'employ': 'use',
    'aesthetics': 'look and feel',
    'visual elements': 'visuals',
    'algorithm': 'process',
    'methodology': 'method',
    'paradigm': 'approach',
    'framework': 'system',
    'architecture': 'structure'
  };

  let simplifiedText = text;
  Object.entries(simplifications).forEach(([technical, simple]) => {
    const regex = new RegExp(`\\b${technical}\\b`, 'gi');
    simplifiedText = simplifiedText.replace(regex, simple);
  });

  // Enhance clarity of questions
  if (!simplifiedText.endsWith('?')) {
    simplifiedText += '?';
  }
  
  // Make questions more conversational
  simplifiedText = simplifiedText
    .replace(/please specify/gi, 'what are')
    .replace(/please provide/gi, 'what are')
    .replace(/please indicate/gi, 'what are')
    .replace(/please describe/gi, 'how would you describe');

  return simplifiedText;
}

export function extractVariables(aiResponse: string, originalPrompt: string): Variable[] {
  console.log("Starting variable extraction with enhanced prompt relevance");
  
  try {
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      console.log("Successfully parsed JSON response");
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      return generateEnhancedVariables(originalPrompt);
    }

    if (Array.isArray(parsedResponse?.variables)) {
      console.log(`Found ${parsedResponse.variables.length} variables in response`);
      
      // Enhance variables with contextual information
      const enhancedVariables = parsedResponse.variables
        .filter(v => v && typeof v === 'object' && v.name)
        .map((v, index) => {
          // Determine if this should be a variable based on expected answer length
          const expectedShortAnswer = isLikelyShortAnswer(v.name, v.category);
          
          if (!expectedShortAnswer) {
            console.log(`Converting ${v.name} to a question due to expected long answer`);
            return null; // This will be filtered out
          }
          
          return {
            id: v.id || `v-${index + 1}`,
            name: enhanceVariableName(v.name, originalPrompt),
            value: v.value || '',
            isRelevant: v.isRelevant === false ? false : true,
            category: v.category || determineVariableCategory(v.name, originalPrompt),
            code: v.code || `VAR_${index + 1}`
          };
        })
        .filter(v => v !== null);

      if (enhancedVariables.length > 0) {
        console.log("Returning enhanced variables:", enhancedVariables);
        return enhancedVariables;
      }
    }
    
    return generateEnhancedVariables(originalPrompt);
  } catch (error) {
    console.error("Error extracting variables:", error);
    return generateEnhancedVariables(originalPrompt);
  }
}

function generateEnhancedVariables(promptText: string): Variable[] {
  console.log("Generating contextual variables from prompt:", promptText);
  
  const variables: Variable[] = [];
  
  // Enhanced patterns for entity extraction with context
  const patterns = [
    // Physical objects with attributes
    { regex: /(?:a|an|the)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(?:that is|with|in)\s+([a-zA-Z\s]+)/i, category: 'Object' },
    // Colors with objects
    { regex: /([a-zA-Z]+)\s+(?:colored|colou?red?)\s+([a-zA-Z]+)/i, category: 'Color' },
    // Colors mentioned
    { regex: /(?:color|colou?r)s?:?\s+([a-zA-Z]+(?:\s*,\s*[a-zA-Z]+)*)/i, category: 'Color' },
    // Sizes and dimensions
    { regex: /(\d+(?:\s*(?:x|\*)\s*\d+)?)\s*(?:pixels?|px|em|rem|%|pts?|points?)?/i, category: 'Size' },
    // Specific attributes
    { regex: /(?:with|having)\s+([a-zA-Z]+)\s+([a-zA-Z]+)/i, category: 'Attribute' },
    // Style preferences
    { regex: /(?:style|theme|design)s?:?\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i, category: 'Style' },
    // Quantities
    { regex: /(\d+)\s+([a-zA-Z]+s?)/i, category: 'Quantity' }
  ];
  
  patterns.forEach((pattern, index) => {
    const matches = Array.from(promptText.matchAll(new RegExp(pattern.regex, 'gi')));
    
    matches.forEach(match => {
      if (match && match[1]) {
        const value = match[1].trim();
        const context = match[2]?.trim();
        
        if (value && !variables.some(v => v.value === value)) {
          const varName = generateDescriptiveVariableName(value, context, pattern.category, promptText);
          
          variables.push({
            id: `v-${variables.length + 1}`,
            name: varName,
            value: '',
            isRelevant: true,
            category: pattern.category,
            code: toCamelCase(varName.split('(')[0].trim()) // Generate clean camelCase code
          });
        }
      }
    });
  });
  
  // Check for color mentions in the prompt
  if (promptText.toLowerCase().includes('color') && !variables.some(v => v.category === 'Color')) {
    variables.push({
      id: `v-${variables.length + 1}`,
      name: 'Color Scheme',
      value: '',
      isRelevant: true,
      category: 'Color',
      code: 'colorScheme'
    });
  }
  
  // Check for style mentions in the prompt
  if ((promptText.toLowerCase().includes('style') || promptText.toLowerCase().includes('theme')) && 
      !variables.some(v => v.category === 'Style')) {
    variables.push({
      id: `v-${variables.length + 1}`,
      name: 'Style Preference',
      value: '',
      isRelevant: true,
      category: 'Style',
      code: 'stylePreference'
    });
  }
  
  // Check for size mentions in the prompt
  if (promptText.toLowerCase().includes('size') && !variables.some(v => v.category === 'Size')) {
    variables.push({
      id: `v-${variables.length + 1}`,
      name: 'Size/Dimensions',
      value: '',
      isRelevant: true,
      category: 'Size',
      code: 'dimensions'
    });
  }
  
  // Always ensure at least two variables for input
  if (variables.length === 0) {
    variables.push({
      id: 'v-1',
      name: 'Main Element',
      value: '',
      isRelevant: true,
      category: 'General',
      code: 'mainElement'
    });
    
    variables.push({
      id: 'v-2',
      name: 'Style',
      value: '',
      isRelevant: true,
      category: 'General',
      code: 'style'
    });
  } else if (variables.length === 1) {
    variables.push({
      id: 'v-2',
      name: variables[0].category === 'Style' ? 'Main Element' : 'Style',
      value: '',
      isRelevant: true,
      category: 'General',
      code: variables[0].category === 'Style' ? 'mainElement' : 'style'
    });
  }
  
  console.log("Generated contextual variables:", variables);
  return variables;
}

function isLikelyShortAnswer(name: string, category: string): boolean {
  // Check if the variable name suggests a short answer (1-3 words)
  const longAnswerKeywords = ['description', 'explain', 'details', 'background', 'context', 'story', 'narrative', 'analysis'];
  const shortAnswerCategories = ['Color', 'Size', 'Number', 'Format', 'Type', 'Style'];
  
  return !longAnswerKeywords.some(keyword => name.toLowerCase().includes(keyword)) ||
         shortAnswerCategories.includes(category);
}

function enhanceVariableName(name: string, promptText: string): string {
  // Add context-specific qualifiers to variable names
  const promptLower = promptText.toLowerCase();
  
  if (name.toLowerCase().includes('color')) {
    const colorExamples = promptLower.includes('blue') || promptLower.includes('red') || promptLower.includes('green') ? 
      'blue, red, green' : 'red, blue, yellow';
    return `${name} (e.g., ${colorExamples})`;
  } else if (name.toLowerCase().includes('size')) {
    return `${name} (e.g., small, large, 100px)`;
  } else if (name.toLowerCase().includes('number')) {
    return `${name} (numeric value)`;
  } else if (name.toLowerCase().includes('style')) {
    const styleExamples = promptLower.includes('modern') ? 'modern, futuristic' : 
                         (promptLower.includes('vintage') ? 'vintage, retro' : 'modern, vintage, minimalist');
    return `${name} (e.g., ${styleExamples})`;
  }
  
  // Check if name already has examples
  if (!name.includes('(') && !name.includes(')')) {
    const category = determineVariableCategory(name, promptText);
    return addExamplesBasedOnCategory(name, category, promptText);
  }
  
  return name;
}

function addExamplesBasedOnCategory(name: string, category: string, promptText: string): string {
  switch (category) {
    case 'Color':
      return `${name} (e.g., blue, red, pastel tones)`;
    case 'Size':
      return `${name} (e.g., small, medium, large)`;
    case 'Style':
      return `${name} (e.g., modern, vintage, minimalist)`;
    case 'Format':
      return `${name} (e.g., PDF, image, text)`;
    case 'Quantity':
      return `${name} (numeric value)`;
    default:
      return name;
  }
}

function determineVariableCategory(name: string, promptText: string): string {
  const nameLower = name.toLowerCase();
  const promptLower = promptText.toLowerCase();
  
  if (nameLower.includes('color') || nameLower.includes('colour') || 
      nameLower.includes('hue') || nameLower.includes('shade')) {
    return 'Color';
  } else if (nameLower.includes('size') || nameLower.includes('dimension') || 
             nameLower.includes('width') || nameLower.includes('height')) {
    return 'Size';
  } else if (nameLower.includes('style') || nameLower.includes('theme') || 
             nameLower.includes('design') || nameLower.includes('aesthetic')) {
    return 'Style';
  } else if (nameLower.includes('number') || nameLower.includes('count') || 
             nameLower.includes('quantity')) {
    return 'Quantity';
  } else if (nameLower.includes('format') || nameLower.includes('type') || 
             nameLower.includes('file') || nameLower.includes('output')) {
    return 'Format';
  } else if (promptLower.includes('image') || promptLower.includes('picture')) {
    return 'Visual';
  } else if (promptLower.includes('text') || promptLower.includes('write')) {
    return 'Content';
  }
  
  return 'General';
}

function generateDescriptiveVariableName(value: string, context: string | undefined, category: string, promptText: string): string {
  // Create more descriptive variable names based on context
  if (context) {
    if (['Color', 'Style', 'Size'].includes(category)) {
      return `${value} (for ${context})`;
    } else {
      return `${category} - ${value} ${context}`;
    }
  } else if (category === 'Size') {
    return `Dimension - ${value}`;
  } else if (category === 'Color') {
    return `Color - ${value}`;
  } else if (category === 'Style') {
    return `Style - ${value}`;
  }
  
  // Handle special cases
  if (promptText.toLowerCase().includes('image') && category === 'Object') {
    return `Main Subject - ${value}`;
  } else if (promptText.toLowerCase().includes('text') && category === 'Object') {
    return `Content Type - ${value}`;
  }
  
  return `${category} - ${value}`;
}

function toCamelCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  }).replace(/[^a-zA-Z0-9]/g, ''); // Remove non-alphanumeric characters
}

/**
 * Extracts the master command from the AI response.
 * @param aiResponse - The raw response from the AI
 * @returns The master command string or empty string if not found
 */
export function extractMasterCommand(aiResponse: string): string {
  console.log("Extracting master command...");
  
  try {
    // Extract master command section
    const commandRegex = /### Master Command:?([\s\S]*?)(?=###|$)/i;
    const commandMatch = aiResponse.match(commandRegex);
    
    if (!commandMatch || !commandMatch[1].trim()) {
      console.log("No master command found");
      return "";
    }
    
    const commandText = commandMatch[1].trim();
    console.log("Master command found:", commandText.substring(0, 50) + (commandText.length > 50 ? "..." : ""));
    
    return commandText;
  } catch (error) {
    console.error("Error extracting master command:", error);
    return "";
  }
}

/**
 * Extracts the enhanced prompt from the AI response.
 * @param aiResponse - The raw response from the AI
 * @returns The enhanced prompt string or empty string if not found
 */
export function extractEnhancedPrompt(aiResponse: string): string {
  console.log("Extracting enhanced prompt from AI response...");
  
  try {
    // Extract enhanced prompt section from the response
    const promptRegex = /### Enhanced Prompt:?([\s\S]*?)(?=###|$)/i;
    const promptMatch = aiResponse.match(promptRegex);
    
    if (!promptMatch || !promptMatch[1].trim()) {
      // Try alternate patterns
      const alternateRegex = /### Final Prompt:?([\s\S]*?)(?=###|$)/i;
      const alternateMatch = aiResponse.match(alternateRegex);
      
      if (!alternateMatch || !alternateMatch[1].trim()) {
        console.log("No enhanced prompt found in AI response.");
        return "";
      }
      
      const promptText = alternateMatch[1].trim();
      console.log("Enhanced prompt found (alternate pattern), length:", promptText.length);
      return promptText;
    }
    
    const promptText = promptMatch[1].trim();
    console.log("Enhanced prompt found, length:", promptText.length);
    
    return promptText;
  } catch (error) {
    console.error("Error extracting enhanced prompt:", error);
    return "";
  }
}
