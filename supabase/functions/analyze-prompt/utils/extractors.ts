import { Question, Variable } from '../types.ts';

export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Extracting questions from AI response, length:", aiResponse.length);
  
  try {
    const questions: Question[] = [];
    
    // Extract questions from pillar sections first - improved regex pattern
    const pillarSectionRegex = /### ([^:]+) Questions:\s*([\s\S]*?)(?=###|$)/g;
    let pillarMatch;
    let foundPillarQuestions = false;
    
    while ((pillarMatch = pillarSectionRegex.exec(aiResponse)) !== null) {
      const category = pillarMatch[1].trim();
      const questionsText = pillarMatch[2].trim();
      
      console.log(`Found pillar section: ${category} with content length: ${questionsText.length}`);
      
      // Parse questions for this pillar - improved question parsing
      const questionLines = questionsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('[') && !line.startsWith('-'));
      
      questionLines.forEach(questionText => {
        if (questionText.trim()) {
          questions.push({
            id: `q-${questions.length + 1}`,
            text: questionText.trim(),
            answer: "",
            isRelevant: null,
            category
          });
          console.log(`Added question under ${category}:`, questionText.substring(0, 50));
        }
      });
      
      foundPillarQuestions = true;
    }
    
    // If no pillar-specific questions found, look for general questions
    if (!foundPillarQuestions) {
      console.log("No pillar-specific questions found, looking for general questions");
      const generalQuestionsRegex = /### Questions:?\s*([\s\S]*?)(?=###|$)/i;
      const questionsMatch = aiResponse.match(generalQuestionsRegex);
      
      if (questionsMatch && questionsMatch[1].trim()) {
        const questionLines = questionsMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('[') && !line.startsWith('-'));
        
        questionLines.forEach(questionText => {
          if (questionText.trim()) {
            questions.push({
              id: `q-${questions.length + 1}`,
              text: questionText.trim(),
              answer: "",
              isRelevant: null,
              category: "General"
            });
          }
        });
      }
    }
    
    // Log the results
    const questionsByCategory = questions.reduce((acc: any, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {});
    
    console.log("Extracted questions by category:", questionsByCategory);
    
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
    
    // First try to extract pillar-specific variables
    const pillarSectionRegex = /### Variables for ([^:]+):\s*([\s\S]*?)(?=###|$)|### Variables:\s*([\s\S]*?)(?=###|$)/gi;
    let match;
    let foundVariables = false;
    
    while ((match = pillarSectionRegex.exec(aiResponse)) !== null) {
      const category = match[1] || 'General';
      const variablesText = (match[1] ? match[2] : match[3])?.trim();
      
      if (!variablesText) continue;
      
      console.log(`Found variables section for category: ${category}`);
      
      // Parse variables line by line
      const variableLines = variablesText.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('-'));
      
      variableLines.forEach(line => {
        const variableMatch = line.match(/([^:]+):\s*(.+)/);
        if (variableMatch) {
          const name = variableMatch[1].trim();
          const description = variableMatch[2].trim();
          
          variables.push({
            id: `v-${variables.length + 1}`,
            name,
            value: '',
            isRelevant: null,
            category,
            code: `VAR_${variables.length + 1}`
          });
          
          console.log(`Added variable: ${name} under ${category}`);
        }
      });
      
      foundVariables = true;
    }
    
    // If no variables found in any section, look for general variables
    if (!foundVariables) {
      console.log("No pillar-specific variables found, looking for general variables");
      const generalVariablesRegex = /### Variables:?\s*([\s\S]*?)(?=###|$)/i;
      const variablesMatch = aiResponse.match(generalVariablesRegex);
      
      if (variablesMatch && variablesMatch[1].trim()) {
        const variableLines = variablesMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('-'));
        
        variableLines.forEach(line => {
          const variableMatch = line.match(/([^:]+):\s*(.+)/);
          if (variableMatch) {
            const name = variableMatch[1].trim();
            const description = variableMatch[2].trim();
            
            variables.push({
              id: `v-${variables.length + 1}`,
              name,
              value: '',
              isRelevant: null,
              category: 'General',
              code: `VAR_${variables.length + 1}`
            });
          }
        });
      }
    }
    
    console.log(`Extracted ${variables.length} variables`);
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
