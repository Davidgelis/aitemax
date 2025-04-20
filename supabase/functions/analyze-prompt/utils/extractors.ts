
import { Question, Variable } from '../types.ts';

export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Starting question extraction with enhanced context handling");
  
  try {
    try {
      const parsedResponse = JSON.parse(aiResponse);
      console.log("Successfully parsed JSON response");
      
      if (Array.isArray(parsedResponse.questions)) {
        console.log(`Found ${parsedResponse.questions.length} questions in JSON`);
        
        // Check for image-based pre-fills
        const imageBasedQuestions = parsedResponse.questions.filter((q: any) => 
          q.answer?.includes("(from image analysis)") || q.contextSource === "image"
        );
        console.log(`Found ${imageBasedQuestions.length} questions with image-based pre-fills`);
        
        return parsedResponse.questions.map((q: any, index: number) => {
          let answer = q.answer || '';
          let contextSource = q.contextSource || '';
          
          // Validate and enhance pre-filled answers
          if (answer.startsWith('PRE-FILLED:')) {
            // Ensure source attribution is present
            if (!answer.includes('(from')) {
              if (contextSource === 'image') {
                answer = `${answer} (from image analysis)`;
                console.log(`Added missing image attribution to question ${q.id || index + 1}`);
              } else if (contextSource === 'smartContext' || contextSource === 'smart') {
                answer = `${answer} (from smart context)`;
                console.log(`Added missing smart context attribution to question ${q.id || index + 1}`);
              } else if (contextSource === 'prompt') {
                answer = `${answer} (from prompt)`;
                console.log(`Added missing prompt attribution to question ${q.id || index + 1}`);
              }
            }
            
            console.log(`Enhanced pre-filled answer for question ${q.id || index + 1} from source: ${contextSource || 'unknown'}`);
          }
          
          return {
            id: q.id || `q-${index + 1}`,
            text: q.text || '',
            answer,
            isRelevant: typeof q.isRelevant === 'boolean' ? q.isRelevant : null,
            category: q.category || 'General'
          };
        });
      } else {
        console.log("No questions array found in JSON response");
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
        // Enhanced regex to capture pre-filled answers with source attribution
        const answerMatch = questionText.match(/PRE-FILLED:\s*(.*?)(?:\(from ([^)]+)\))?(?=\n|$)/);
        
        const answer = answerMatch 
          ? (answerMatch[1].trim() + (answerMatch[2] ? ` (from ${answerMatch[2]})` : ''))
          : '';
          
        const source = answerMatch && answerMatch[2] 
          ? answerMatch[2].trim() 
          : (answer.includes('image') ? 'image analysis' : 
             answer.includes('smart') ? 'smart context' : 
             answer ? 'prompt' : '');
        
        questions.push({
          id: `q-${questions.length + 1}`,
          text: questionText.replace(/PRE-FILLED:\s*.*$/, '').trim(),
          answer: answerMatch ? `PRE-FILLED: ${answer}` : '',
          isRelevant: answerMatch ? true : null,
          category
        });
      }
    }
    
    console.log(`Extracted ${questions.length} questions using regex`);
    
    // Check for image-based pre-fills in regex extraction
    const imageBasedQuestions = questions.filter(q => 
      q.answer?.includes("(from image analysis)") || q.answer?.includes("image")
    );
    console.log(`Found ${imageBasedQuestions.length} questions with image-based pre-fills using regex`);
    
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
