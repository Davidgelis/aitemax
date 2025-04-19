
import { Question, Variable } from '../types.ts';

export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Extracting questions with enhanced pillar detection");
  
  try {
    const questions: Question[] = [];
    
    // Enhanced regex to better capture pillar-based questions and pre-filled content
    const pillarSectionRegex = /### ([^:]+) Questions:\s*([\s\S]*?)(?=###|$)/g;
    let pillarMatch;
    
    while ((pillarMatch = pillarSectionRegex.exec(aiResponse)) !== null) {
      const category = pillarMatch[1].trim();
      const questionsText = pillarMatch[2].trim();
      
      console.log(`Found question section for pillar: ${category}`);
      
      // Split into individual question blocks
      const questionBlocks = questionsText.split(/(?=\d+\.|\n\s*\n)/).filter(block => block.trim());
      console.log(`Found ${questionBlocks.length} questions for pillar: ${category}`);
      
      questionBlocks.forEach(block => {
        const lines = block.trim().split('\n');
        let questionText = '';
        let answer = '';
        let isPreFilled = false;
        
        lines.forEach(line => {
          const preFilledMatch = line.match(/PRE-FILLED:\s*(.*)/);
          if (preFilledMatch) {
            isPreFilled = true;
            answer = preFilledMatch[1].trim();
          } else if (!line.startsWith('[') && line.trim() && !questionText) {
            // First non-empty, non-instruction line is the question
            questionText = line.trim();
          } else if (!line.startsWith('[') && line.trim() && questionText && !isPreFilled && !answer) {
            // If we found additional content that's not pre-filled and not the question itself,
            // it might be part of an answer without proper PRE-FILLED prefix
            if (answer) {
              answer += ' ' + line.trim();
            } else {
              answer = line.trim();
            }
          }
        });
        
        if (questionText) {
          // Clean up question text (remove numbers and other artifacts)
          questionText = questionText.replace(/^\d+\.\s*/, '').trim();
          
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
    
    console.log(`Total extracted questions: ${questions.length}`);
    
    // If no questions were extracted with the pillar-based approach, try a fallback method
    if (questions.length === 0) {
      console.log("No pillar-based questions found, trying fallback extraction method");
      
      const fallbackQuestionRegex = /\d+\.\s*([^\n]+)(?:\s*PRE-FILLED:\s*([^\n]*))?/g;
      let fallbackMatch;
      
      while ((fallbackMatch = fallbackQuestionRegex.exec(aiResponse)) !== null) {
        const questionText = fallbackMatch[1].trim();
        const answer = fallbackMatch[2] ? fallbackMatch[2].trim() : '';
        
        questions.push({
          id: `q-${questions.length + 1}`,
          text: questionText,
          answer: answer,
          isRelevant: answer ? true : null,
          category: 'General'
        });
      }
      
      console.log(`Extracted ${questions.length} questions with fallback method`);
    }
    
    return questions;
  } catch (error) {
    console.error("Error extracting questions:", error);
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
