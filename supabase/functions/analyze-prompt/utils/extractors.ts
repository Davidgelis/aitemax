import { Question, Variable } from '../types.ts';

export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Extracting questions from AI response, length:", aiResponse.length);
  
  try {
    const questions: Question[] = [];
    
    // First try to extract pillar-specific question sections
    const pillarRegex = /### Questions for ([^:]+):\s*([\s\S]*?)(?=###|$)/gi;
    let pillarMatch;
    let foundPillarQuestions = false;
    
    while ((pillarMatch = pillarRegex.exec(aiResponse)) !== null) {
      const category = pillarMatch[1].trim();
      const questionsText = pillarMatch[2].trim();
      
      // Parse questions for this pillar
      const questionItems = questionsText
        .split('\n')
        .map(q => q.trim())
        .filter(q => q && !q.startsWith('*')) // Filter out lines starting with asterisk
        .map(q => q.replace(/\(.*?\)$/, '')); // Remove pillar labels at the end
      
      questionItems.forEach((item, index) => {
        if (item.trim()) {
          questions.push({
            id: `q-${questions.length + 1}`,
            text: item.trim(),
            answer: "",
            isRelevant: null,
            category
          });
        }
      });
      
      foundPillarQuestions = true;
    }
    
    // If no pillar-specific questions found, try general questions section
    if (!foundPillarQuestions) {
      const generalQuestionsRegex = /### Questions:?([\s\S]*?)(?=###|$)/i;
      const questionsMatch = aiResponse.match(generalQuestionsRegex);
      
      if (questionsMatch && questionsMatch[1].trim()) {
        const questionItems = questionsMatch[1]
          .split('\n')
          .map(q => q.trim())
          .filter(q => q && !q.startsWith('*')) // Filter out lines starting with asterisk
          .map(q => q.replace(/\(.*?\)$/, '')); // Remove pillar labels at the end
        
        questionItems.forEach((item, index) => {
          if (item.trim()) {
            questions.push({
              id: `q-${questions.length + 1}`,
              text: item.trim(),
              answer: "",
              isRelevant: null,
              category: "General"
            });
          }
        });
      }
    }
    
    console.log("Extracted questions:", questions.length);
    return questions;
  } catch (error) {
    console.error("Error extracting questions:", error);
    return [];
  }
}

export function extractVariables(aiResponse: string, originalPrompt: string): Variable[] {
  console.log("Extracting variables from AI response...");
  
  try {
    const variables: Variable[] = [];
    
    // First try to extract pillar-specific variable sections
    const pillarRegex = /### Variables for ([^:]+):\s*([\s\S]*?)(?=###|$)/gi;
    let pillarMatch;
    let foundPillarVariables = false;
    
    while ((pillarMatch = pillarRegex.exec(aiResponse)) !== null) {
      const category = pillarMatch[1].trim();
      const variablesText = pillarMatch[2].trim();
      
      // Parse variables for this pillar
      const variableItems = variablesText
        .split('\n')
        .map(v => v.trim())
        .filter(v => v && v.startsWith('*')); // Only process lines starting with *
      
      variableItems.forEach((item, index) => {
        // Remove asterisk and clean up the variable text
        const cleanItem = item.replace(/^\*\s*/, '');
        
        // Try to extract variable name and suggested value
        const nameValueMatch = cleanItem.match(/([^:(\n]+)(?:\s*\(([^)]+)\))?\s*:\s*(.+)/);
        if (nameValueMatch) {
          const name = nameValueMatch[1].trim();
          const value = nameValueMatch[3].trim();
          
          variables.push({
            id: `v-${variables.length + 1}`,
            name,
            value: '', // Start with empty value unless background info was provided
            isRelevant: null,
            category,
            code: `VAR_${variables.length + 1}`
          });
        }
      });
      
      foundPillarVariables = true;
    }
    
    // If no pillar-specific variables found, try general variables section
    if (!foundPillarVariables) {
      const generalVariablesRegex = /### Variables:?([\s\S]*?)(?=###|$)/i;
      const variablesMatch = aiResponse.match(generalVariablesRegex);
      
      if (variablesMatch && variablesMatch[1].trim()) {
        const variableItems = variablesMatch[1]
          .split('\n')
          .map(v => v.trim())
          .filter(v => v && v.startsWith('*')); // Only process lines starting with *
        
        variableItems.forEach((item, index) => {
          // Remove asterisk and clean up the variable text
          const cleanItem = item.replace(/^\*\s*/, '');
          
          // Try to extract variable name and category if present
          const nameMatch = cleanItem.match(/([^:(\n]+)(?:\s*\(([^)]+)\))?\s*:?\s*(.*)/);
          if (nameMatch) {
            const name = nameMatch[1].trim();
            const category = nameMatch[2]?.trim() || "General";
            
            variables.push({
              id: `v-${variables.length + 1}`,
              name,
              value: '', // Start with empty value unless background info was provided
              isRelevant: null,
              category,
              code: `VAR_${variables.length + 1}`
            });
          }
        });
      }
    }
    
    console.log("Extracted variables:", variables.length);
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
