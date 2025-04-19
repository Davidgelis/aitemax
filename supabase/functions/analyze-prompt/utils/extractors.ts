import { Question, Variable } from '../types.ts';

export function extractQuestions(aiResponse: string, originalPrompt: string): Question[] {
  console.log("Extracting questions from AI response, length:", aiResponse.length);
  
  try {
    const questions: Question[] = [];
    
    // Extract questions from pillar sections with pre-filled answers
    const pillarSectionRegex = /### ([^:]+) Questions:\s*([\s\S]*?)(?=###|$)/g;
    let pillarMatch;
    let foundPillarQuestions = false;
    
    while ((pillarMatch = pillarSectionRegex.exec(aiResponse)) !== null) {
      const category = pillarMatch[1].trim();
      const questionsText = pillarMatch[2].trim();
      
      console.log(`Found pillar section: ${category} with content length: ${questionsText.length}`);
      
      // Parse questions and pre-filled answers
      const questionLines = questionsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('['));
      
      questionLines.forEach(questionText => {
        if (questionText.trim()) {
          // Enhanced pre-filled answer detection
          const prefillMatch = questionText.match(/(.*?)PRE-FILLED:\s*([\s\S]*)/i);
          
          if (prefillMatch) {
            const questionContent = prefillMatch[1].trim();
            const preFilledAnswer = prefillMatch[2].trim();
            
            questions.push({
              id: `q-${questions.length + 1}`,
              text: questionContent,
              answer: preFilledAnswer,
              isRelevant: true, // Pre-filled answers are marked as relevant
              category
            });
            
            console.log(`Added pre-filled question under ${category}:`, {
              text: questionContent.substring(0, 50),
              answerLength: preFilledAnswer.length
            });
          } else {
            questions.push({
              id: `q-${questions.length + 1}`,
              text: questionText.trim(),
              answer: "",
              isRelevant: null,
              category
            });
          }
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
          .filter(line => line && !line.startsWith('['));
        
        questionLines.forEach(questionText => {
          if (questionText.trim()) {
            // Check for pre-filled answers in general questions
            const prefillMatch = questionText.match(/(.*?)PRE-FILLED:\s*([\s\S]*)/i);
            
            if (prefillMatch) {
              questions.push({
                id: `q-${questions.length + 1}`,
                text: prefillMatch[1].trim(),
                answer: prefillMatch[2].trim(),
                isRelevant: true,
                category: "General"
              });
            } else {
              questions.push({
                id: `q-${questions.length + 1}`,
                text: questionText.trim(),
                answer: "",
                isRelevant: null,
                category: "General"
              });
            }
          }
        });
      }
    }
    
    // Log the results
    const questionsByCategory = questions.reduce((acc: any, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {});
    
    const preFilledCount = questions.filter(q => q.answer).length;
    console.log("Extracted questions summary:", {
      total: questions.length,
      preFilled: preFilledCount,
      byCategory: questionsByCategory
    });
    
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
      
      // Parse variables line by line with enhanced pre-filled detection
      const variableLines = variablesText.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('-'));
      
      variableLines.forEach(line => {
        // Enhanced pre-filled value detection
        const prefillMatch = line.match(/([^:]+):\s*([^(PRE-FILLED)]+)(?:PRE-FILLED:\s*(.+))?/i);
        
        if (prefillMatch) {
          const name = prefillMatch[1].trim();
          const description = prefillMatch[2].trim();
          const preFilledValue = prefillMatch[3]?.trim() || '';
          
          variables.push({
            id: `v-${variables.length + 1}`,
            name,
            value: preFilledValue,
            isRelevant: preFilledValue ? true : null,
            category,
            code: `VAR_${variables.length + 1}`
          });
          
          console.log(`Added variable: ${name} under ${category}${preFilledValue ? ' (pre-filled)' : ''}`);
        }
      });
      
      foundVariables = true;
    }
    
    // Log the results
    console.log(`Extracted ${variables.length} variables:`, {
      preFilledCount: variables.filter(v => v.value).length,
      categories: [...new Set(variables.map(v => v.category))]
    });
    
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
