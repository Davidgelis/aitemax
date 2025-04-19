import { Question, Variable } from '../types.ts';

export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Starting question extraction with enhanced validation");
  console.log("AI Response excerpt:", aiResponse.substring(0, 200) + "...");
  
  try {
    const questions: Question[] = [];
    
    // First try to parse as JSON if the response is in JSON format
    try {
      const jsonResponse = JSON.parse(aiResponse);
      if (jsonResponse.questions && Array.isArray(jsonResponse.questions)) {
        console.log("Successfully parsed JSON response with questions");
        return jsonResponse.questions.map((q: any, index: number) => ({
          id: q.id || `q-${index + 1}`,
          text: q.text,
          answer: q.answer || "",
          isRelevant: q.isRelevant ?? null,
          category: q.category || "General"
        }));
      }
    } catch (jsonError) {
      console.log("Response is not in JSON format, proceeding with text parsing");
    }
    
    // Enhanced regex to better capture questions and pre-filled content
    const questionSectionRegex = /(?:###\s*([^:]+)\s*Questions:|\n\d+\.|Q:)\s*([\s\S]*?)(?=###|$)/g;
    let sectionMatch;
    
    while ((sectionMatch = questionSectionRegex.exec(aiResponse)) !== null) {
      const category = sectionMatch[1]?.trim() || "General";
      const questionsText = sectionMatch[2].trim();
      
      console.log(`Found question section for category: ${category}`);
      
      // Split into individual question blocks
      const questionBlocks = questionsText.split(/(?=\d+\.|Q:)/).filter(block => block.trim());
      console.log(`Found ${questionBlocks.length} questions in category ${category}`);
      
      questionBlocks.forEach(block => {
        const lines = block.trim().split('\n');
        let questionText = '';
        let answer = '';
        let isPreFilled = false;
        
        lines.forEach(line => {
          if (line.includes("PRE-FILLED:")) {
            isPreFilled = true;
            answer = line.split("PRE-FILLED:")[1].trim();
            console.log(`Found pre-filled answer: ${answer.substring(0, 50)}...`);
          } else if (!questionText && line.trim()) {
            questionText = line.replace(/^\d+\.\s*|Q:\s*/i, '').trim();
          }
        });
        
        if (questionText) {
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
    
    console.log(`Extracted ${questions.length} total questions`);
    console.log("Questions with pre-filled answers:", 
      questions.filter(q => q.answer).length);
    
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
