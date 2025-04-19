import { Question, Variable } from '../types.ts';

export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Extracting questions with enhanced pre-fill detection");
  
  try {
    const questions: Question[] = [];
    
    // Enhanced regex to better capture pre-filled content and handle categories
    const pillarSectionRegex = /### ([^:]+) Questions:\s*([\s\S]*?)(?=###|$)/g;
    let pillarMatch;
    
    while ((pillarMatch = pillarSectionRegex.exec(aiResponse)) !== null) {
      const category = pillarMatch[1].trim();
      const questionsText = pillarMatch[2].trim();
      
      // Split into individual question blocks
      const questionBlocks = questionsText.split(/(?=\d+\.|\n\s*\n)/).filter(block => block.trim());
      
      questionBlocks.forEach(block => {
        const lines = block.trim().split('\n');
        let questionText = '';
        let answer = '';
        let isPreFilled = false;
        
        lines.forEach(line => {
          if (line.includes('PRE-FILLED:')) {
            isPreFilled = true;
            answer = line.split('PRE-FILLED:')[1].trim();
          } else if (!line.startsWith('[') && line.trim()) {
            questionText = line.trim();
          }
        });
        
        if (questionText || answer) {
          questions.push({
            id: `q-${questions.length + 1}`,
            text: questionText,
            answer: answer,
            isRelevant: isPreFilled ? true : null,
            category
          });
        }
      });
    }
    
    return questions;
  } catch (error) {
    console.error("Error extracting questions:", error);
    return [];
  }
}

export function extractVariables(aiResponse: string, originalPrompt: string): Variable[] {
  console.log("Extracting variables with enhanced detection");
  
  try {
    const variables: Variable[] = [];
    
    // Enhanced regex to better capture variables and their values
    const variablesSectionRegex = /### Variables(?:\s+for\s+([^:]+))?:\s*([\s\S]*?)(?=###|$)/gi;
    let match;
    
    while ((match = variablesSectionRegex.exec(aiResponse)) !== null) {
      const category = match[1] || 'General';
      const variablesText = match[2]?.trim();
      
      if (!variablesText) continue;
      
      // Split into individual variable entries
      const variableEntries = variablesText.split(/\n(?=\w)/).filter(entry => entry.trim());
      
      variableEntries.forEach(entry => {
        // Enhanced regex to capture name, description, and pre-filled value
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
