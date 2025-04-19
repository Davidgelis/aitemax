import { Question, Variable } from '../types.ts';

export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Starting question extraction");
  
  try {
    // Try to parse the response as JSON first
    try {
      const parsedResponse = JSON.parse(aiResponse);
      console.log("Successfully parsed JSON response");
      
      if (Array.isArray(parsedResponse.questions)) {
        console.log(`Found ${parsedResponse.questions.length} questions in JSON`);
        return parsedResponse.questions.map((q: any, index: number) => ({
          id: q.id || `q-${index + 1}`,
          text: q.text || '',
          answer: q.answer || '',
          isRelevant: typeof q.isRelevant === 'boolean' ? q.isRelevant : null,
          category: q.category || 'General'
        }));
      }
    } catch (jsonError) {
      console.error("JSON parsing failed:", jsonError);
    }
    
    // Fallback to regex-based extraction if JSON parsing fails
    console.log("Falling back to regex extraction");
    const questions: Question[] = [];
    const questionRegex = /(?:###\s*([^:]+)\s*Questions:|Q\d+:)\s*(.*?)(?=###|Q\d+:|$)/gs;
    
    let match;
    while ((match = questionRegex.exec(aiResponse)) !== null) {
      const category = match[1]?.trim() || 'General';
      const questionText = match[2].trim();
      
      if (questionText) {
        const answerMatch = questionText.match(/PRE-FILLED:\s*(.*?)(?=\n|$)/);
        questions.push({
          id: `q-${questions.length + 1}`,
          text: questionText.replace(/PRE-FILLED:\s*.*$/, '').trim(),
          answer: answerMatch ? answerMatch[1].trim() : '',
          isRelevant: answerMatch ? true : null,
          category
        });
      }
    }
    
    console.log(`Extracted ${questions.length} questions`);
    return questions;
  } catch (error) {
    console.error("Error in question extraction:", error);
    return [];
  }
}

export function extractVariables(aiResponse: string, originalPrompt: string): Variable[] {
  console.log("Extracting variables with enhanced pillar detection");
  
  try {
    const variables: Variable[] = [];
    
    // Enhanced regex to better capture pillar-based variables and their values
    const variablesSectionRegex = /### ([^:]+) Variables:\s*([\s\S]*?)(?=###|$)/gi;
    let match;
    
    while ((match = variablesSectionRegex.exec(aiResponse)) !== null) {
      const category = match[1].trim();
      const variablesText = match[2]?.trim();
      
      if (!variablesText) continue;
      
      console.log(`Found variable section for pillar: ${category}`);
      
      // Split into individual variable entries
      const variableEntries = variablesText.split(/\n(?=\w)/).filter(entry => entry.trim());
      console.log(`Found ${variableEntries.length} variables for pillar: ${category}`);
      
      variableEntries.forEach(entry => {
        // Enhanced regex to capture name, description, and pre-filled value
        // This handles both formats:
        // 1. Name: Description PRE-FILLED: Value
        // 2. Name: Description
        const varMatch = entry.match(/([^:]+):\s*([^(PRE-FILLED)]+)(?:PRE-FILLED:\s*(.+))?/i);
        
        if (varMatch) {
          const name = varMatch[1].trim();
          const description = varMatch[2]?.trim() || '';
          const preFilledValue = varMatch[3]?.trim() || '';
          
          if (name) {
            variables.push({
              id: `v-${variables.length + 1}`,
              name,
              value: preFilledValue,
              isRelevant: preFilledValue ? true : null,
              category,
              code: `VAR_${variables.length + 1}`
            });
          }
        }
      });
    }
    
    console.log(`Total extracted variables: ${variables.length}`);
    
    // If no variables were extracted with the pillar-based approach, try a fallback approach
    if (variables.length === 0) {
      console.log("No pillar-based variables found, trying fallback extraction method");
      
      // Look for a general Variables section
      const fallbackVariablesSectionRegex = /### Variables:\s*([\s\S]*?)(?=###|$)/i;
      const fallbackMatch = aiResponse.match(fallbackVariablesSectionRegex);
      
      if (fallbackMatch && fallbackMatch[1].trim()) {
        const variablesText = fallbackMatch[1].trim();
        const variableEntries = variablesText.split(/\n(?=\w)/).filter(entry => entry.trim());
        
        console.log(`Found ${variableEntries.length} variables with fallback method`);
        
        variableEntries.forEach(entry => {
          const varMatch = entry.match(/([^:]+):\s*([^(PRE-FILLED)]+)(?:PRE-FILLED:\s*(.+))?/i);
          
          if (varMatch) {
            const name = varMatch[1].trim();
            const description = varMatch[2]?.trim() || '';
            const preFilledValue = varMatch[3]?.trim() || '';
            
            if (name) {
              variables.push({
                id: `v-${variables.length + 1}`,
                name,
                value: preFilledValue,
                isRelevant: preFilledValue ? true : null,
                category: 'General',
                code: `VAR_${variables.length + 1}`
              });
            }
          }
        });
      }
    }
    
    return variables;
  } catch (error) {
    console.error("Error extracting variables:", error);
    return [];
  }
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
    console.log("Master command found:", commandText.substring(0, 50));
    
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
