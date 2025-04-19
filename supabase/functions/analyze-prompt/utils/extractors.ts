
import { Question, Variable } from '../types.ts';

/**
 * Extracts questions from the AI response.
 * @param aiResponse - The raw response from the AI
 * @param originalPrompt - The original prompt text
 * @returns Array of extracted questions
 */
export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Extracting questions from AI response...");
  
  try {
    // First try to extract a questions section from the response
    const questionsRegex = /### Questions:?([\s\S]*?)(?=###|$)/i;
    const questionsMatch = aiResponse.match(questionsRegex);
    
    if (!questionsMatch || !questionsMatch[1].trim()) {
      console.log("No questions section found in AI response.");
      return [];
    }
    
    const questionsText = questionsMatch[1].trim();
    console.log("Questions section found, length:", questionsText.length);
    
    // Parse individual questions using numbered or bulleted format
    const questionItems = questionsText.split(/\n\s*(?:\d+[\.\):]|\*|\-)\s+/);
    
    // Filter out empty items and process each question
    const extractedQuestions = questionItems
      .filter(item => item.trim().length > 0)
      .map((item, index) => {
        // Try to extract category from the question text
        const categoryMatch = item.match(/^\s*\*?\*?([A-Za-z\s]+)\*?\*?\s*:/);
        const category = categoryMatch ? categoryMatch[1].trim() : 'General';
        
        // Clean up the question text
        let text = item.trim();
        
        return {
          id: `q-${index + 1}`,
          text,
          answer: "",
          isRelevant: null,
          category
        };
      });
    
    console.log(`Successfully extracted ${extractedQuestions.length} questions.`);
    
    return extractedQuestions;
  } catch (error) {
    console.error("Error extracting questions:", error);
    return [];
  }
}

/**
 * Extracts variables from the AI response.
 * @param aiResponse - The raw response from the AI
 * @param originalPrompt - The original prompt text
 * @returns Array of extracted variables
 */
export function extractVariables(aiResponse: string, originalPrompt: string): Variable[] {
  console.log("Extracting variables from AI response...");
  
  try {
    // Extract variables section from the response
    const variablesRegex = /### Variables:?([\s\S]*?)(?=###|$)/i;
    const variablesMatch = aiResponse.match(variablesRegex);
    
    if (!variablesMatch || !variablesMatch[1].trim()) {
      console.log("No variables section found in AI response.");
      return [];
    }
    
    const variablesText = variablesMatch[1].trim();
    console.log("Variables section found, length:", variablesText.length);
    
    // Parse individual variables
    const variableItems = variablesText.split(/\n\s*(?:\d+[\.\):]|\*|\-)\s+/);
    
    // Filter out empty items and process each variable
    const extractedVariables = variableItems
      .filter(item => item.trim().length > 0)
      .map((item, index) => {
        // Try to extract a variable name from the text
        const nameMatch = item.match(/^\s*\*?\*?([A-Za-z\s]+)\*?\*?\s*:/);
        const name = nameMatch ? nameMatch[1].trim() : `Variable ${index + 1}`;
        
        // Assign a category if possible
        const categoryMatch = item.match(/\(([A-Za-z\s]+)\)/);
        const category = categoryMatch ? categoryMatch[1].trim() : 'General';
        
        return {
          id: `v-${index + 1}`,
          name,
          value: "",
          isRelevant: null,
          category,
          code: `VAR_${index + 1}`
        };
      });
    
    console.log(`Successfully extracted ${extractedVariables.length} variables.`);
    
    return extractedVariables;
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
  console.log("Extracting master command from AI response...");
  
  try {
    // Extract master command section from the response
    const commandRegex = /### Master Command:?([\s\S]*?)(?=###|$)/i;
    const commandMatch = aiResponse.match(commandRegex);
    
    if (!commandMatch || !commandMatch[1].trim()) {
      console.log("No master command found in AI response.");
      return "";
    }
    
    const commandText = commandMatch[1].trim();
    console.log("Master command found, length:", commandText.length);
    
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
