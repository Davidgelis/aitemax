
import { Question, Variable } from '../types.ts';

export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Starting question extraction with enhanced user-friendly context");
  
  try {
    try {
      const parsedResponse = JSON.parse(aiResponse);
      console.log("Successfully parsed JSON response");
      
      if (Array.isArray(parsedResponse.questions)) {
        console.log(`Found ${parsedResponse.questions.length} questions in JSON`);
        
        return parsedResponse.questions.map((q: any, index: number) => {
          let text = q.text || '';
          
          // Add examples if they're not already present
          if (!text.includes('(') && !text.includes(')')) {
            const examples = generateSimpleExamples(text, originalPrompt);
            if (examples) {
              text += ` (${examples})`;
            }
          }
          
          // Simplify technical terms in the question
          text = simplifyTechnicalTerms(text);
          
          return {
            id: q.id || `q-${index + 1}`,
            text,
            answer: q.answer || '',
            isRelevant: typeof q.isRelevant === 'boolean' ? q.isRelevant : true,
            category: q.category || 'General'
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

function generateSimpleExamples(question: string, originalPrompt: string): string {
  // Extract relevant entities from original prompt
  const nouns = extractNouns(originalPrompt);
  
  // Add simple examples based on question content and original prompt entities
  if (question.toLowerCase().includes('color')) {
    if (nouns.some(n => n.toLowerCase().includes('ball'))) {
      return 'like "bright red" or "blue with white stripes"';
    } else if (nouns.some(n => n.toLowerCase().includes('dog'))) {
      return 'like "golden brown" or "black and white spotted"';
    } else {
      return 'like "sunny yellow" or "ocean blue"';
    }
  } else if (question.toLowerCase().includes('size')) {
    if (nouns.some(n => n.toLowerCase().includes('ball'))) {
      return 'like "tennis ball sized" or "basketball sized"';
    } else {
      return 'like "as big as an apple" or "about the size of a phone"';
    }
  } else if (question.toLowerCase().includes('style') || question.toLowerCase().includes('type')) {
    if (nouns.some(n => n.toLowerCase().includes('dog'))) {
      return 'like "Golden Retriever" or "German Shepherd"';
    } else {
      return 'like "modern and sleek" or "vintage style"';
    }
  } else if (question.toLowerCase().includes('shape')) {
    return 'like "round like a ball" or "long like a pencil"';
  } else if (question.toLowerCase().includes('background') || question.toLowerCase().includes('setting')) {
    return 'like "park with trees" or "beach with waves"';
  } else if (question.toLowerCase().includes('action') || question.toLowerCase().includes('doing')) {
    if (nouns.some(n => n.toLowerCase().includes('dog'))) {
      return 'like "jumping to catch" or "running with the ball in mouth"';
    } else {
      return 'like "quickly moving" or "sitting still"';
    }
  }
  return '';
}

// Extract potential nouns from the prompt text to help with examples
function extractNouns(promptText: string): string[] {
  const words = promptText.toLowerCase().split(/\s+/);
  const commonNouns = ['dog', 'cat', 'person', 'man', 'woman', 'child', 'house', 'car', 'ball', 'tree', 'flower', 'sky', 'water', 'mountain', 'building'];
  return words.filter(word => commonNouns.includes(word) || commonNouns.some(noun => word.includes(noun)));
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
    'rendering': 'creating',
    'algorithm': 'method',
    'vector': 'direction',
    'composition': 'arrangement',
    'perspective': 'viewpoint',
    'saturation': 'color vividness',
    'illumination': 'lighting'
  };

  let simplifiedText = text;
  Object.entries(simplifications).forEach(([technical, simple]) => {
    const regex = new RegExp(`\\b${technical}\\b`, 'gi');
    simplifiedText = simplifiedText.replace(regex, simple);
  });

  return simplifiedText;
}

export function extractVariables(aiResponse: string, originalPrompt: string): Variable[] {
  console.log("Starting variable extraction with enhanced context handling");
  
  try {
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      console.log("Successfully parsed JSON response");
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      return generateContextualVariables(originalPrompt);
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
            name: enhanceVariableName(v.name),
            value: v.value || '',
            isRelevant: v.isRelevant === false ? false : true,
            category: v.category || 'General',
            code: v.code || `VAR_${index + 1}`
          };
        })
        .filter(v => v !== null);

      if (enhancedVariables.length > 0) {
        console.log("Returning enhanced variables:", enhancedVariables);
        return enhancedVariables;
      }
    }
    
    return generateContextualVariables(originalPrompt);
  } catch (error) {
    console.error("Error extracting variables:", error);
    return generateContextualVariables(originalPrompt);
  }
}

function generateContextualVariables(promptText: string): Variable[] {
  console.log("Generating contextual variables from prompt:", promptText);
  
  const variables: Variable[] = [];
  
  // Enhanced patterns for entity extraction with context
  const patterns = [
    // Physical objects with attributes
    { regex: /(?:a|the)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(?:that is|with|in)\s+([a-zA-Z\s]+)/i, category: 'Object' },
    // Colors with objects
    { regex: /([a-zA-Z]+)\s+(?:colored|colou?red?)\s+([a-zA-Z]+)/i, category: 'Color' },
    // Sizes and dimensions
    { regex: /(\d+(?:\s*(?:x|\*)\s*\d+)?)\s*(?:pixels?|px|em|rem|%|pts?|points?)?/i, category: 'Size' },
    // Specific attributes
    { regex: /(?:with|having)\s+([a-zA-Z]+)\s+([a-zA-Z]+)/i, category: 'Attribute' },
    // Quantities
    { regex: /(\d+)\s+([a-zA-Z]+s?)/i, category: 'Quantity' },
    // Specific colors
    { regex: /\b(red|blue|green|yellow|black|white|purple|orange|pink|brown|gray|grey)\s+([a-zA-Z]+)\b/i, category: 'Color' },
    // Actions with objects
    { regex: /\b(playing|running|jumping|sitting|standing|eating|drinking|throwing|catching)\s+(?:with)?\s+(?:a|an|the)?\s*([a-zA-Z]+)\b/i, category: 'Action' },
    // Basic object detection 
    { regex: /\b(?:a|an|the)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\b/i, category: 'Object' }
  ];
  
  patterns.forEach((pattern, index) => {
    const matches = Array.from(promptText.matchAll(new RegExp(pattern.regex, 'gi')));
    
    matches.forEach(match => {
      if (match && match[1]) {
        const value = match[1].trim();
        const context = match[2]?.trim();
        
        if (value && !variables.some(v => v.value === value)) {
          const varName = generateDescriptiveVariableName(value, context, pattern.category);
          
          variables.push({
            id: `v-${variables.length + 1}`,
            name: varName,
            value: value,
            isRelevant: true,
            category: pattern.category,
            code: `VAR_${variables.length + 1}`
          });
        }
      }
    });
  });
  
  // Always ensure at least one variable for input
  if (variables.length === 0) {
    variables.push({
      id: 'v-1',
      name: 'Main Element',
      value: '',
      isRelevant: true,
      category: 'General',
      code: 'VAR_1'
    });
  }
  
  console.log("Generated contextual variables:", variables);
  return variables;
}

function isLikelyShortAnswer(name: string, category: string): boolean {
  // Check if the variable name suggests a short answer (1-3 words)
  const longAnswerKeywords = ['description', 'explain', 'details', 'background', 'context'];
  const shortAnswerCategories = ['Color', 'Size', 'Number', 'Format', 'Type'];
  
  return !longAnswerKeywords.some(keyword => name.toLowerCase().includes(keyword)) ||
         shortAnswerCategories.includes(category);
}

function enhanceVariableName(name: string): string {
  // Add context-specific qualifiers to variable names
  if (name.toLowerCase().includes('color')) {
    return `${name} (e.g., red, blue)`;
  } else if (name.toLowerCase().includes('size')) {
    return `${name} (e.g., small, large, 100px)`;
  } else if (name.toLowerCase().includes('number')) {
    return `${name} (numeric value)`;
  }
  return name;
}

function generateDescriptiveVariableName(value: string, context: string | undefined, category: string): string {
  // Create more descriptive variable names based on context
  if (context) {
    return `${category} - ${value} ${context}`;
  } else if (category === 'Size') {
    return `Dimension - ${value}`;
  } else if (category === 'Color') {
    return `Color Value - ${value}`;
  } else if (category === 'Object') {
    return `${value} - Detail`;
  } else if (category === 'Action') {
    return `Action - ${value}`;
  }
  return `${category} - ${value}`;
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
