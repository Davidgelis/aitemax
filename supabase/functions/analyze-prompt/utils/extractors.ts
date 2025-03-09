
// Utility functions to extract structured data from OpenAI analysis

/**
 * Extract the questions from the analysis
 */
export function extractQuestions(analysis: string, promptText: string): any[] {
  try {
    // Try to find a JSON block in the analysis
    const jsonMatch = analysis.match(/```json([\s\S]*?)```/);
    
    if (jsonMatch && jsonMatch[1]) {
      // Try to parse the JSON
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed && Array.isArray(parsed.questions)) {
          console.log(`Extracted ${parsed.questions.length} questions from analysis JSON`);
          
          // Check for pre-filled questions
          const prefilledCount = parsed.questions.filter((q: any) => q.answer && q.answer.trim() !== "").length;
          if (prefilledCount > 0) {
            console.log(`Found ${prefilledCount} pre-filled question answers`);
          }
          
          return parsed.questions;
        }
      } catch (e) {
        console.error("Error parsing JSON from analysis:", e);
      }
    }
    
    // Fallback: Try to extract questions using regex patterns
    const questionPattern = /(?:Question|Q):\s*(.+?)(?:\r?\n|$)|(?:"text":\s*"(.+?)",)/g;
    const questions = [];
    let match;
    let index = 1;
    
    while ((match = questionPattern.exec(analysis)) !== null) {
      const text = match[1] || match[2];
      if (text) {
        // Try to extract a potential category
        let category = "General";
        
        // Look for category indicators in the question or nearby text
        const lowerText = text.toLowerCase();
        if (lowerText.includes("goal") || lowerText.includes("purpose") || lowerText.includes("objective")) {
          category = "Goal";
        } else if (lowerText.includes("audience") || lowerText.includes("user") || lowerText.includes("reader")) {
          category = "Audience";
        } else if (lowerText.includes("tone") || lowerText.includes("style") || lowerText.includes("voice")) {
          category = "Style";
        } else if (lowerText.includes("format") || lowerText.includes("structure") || lowerText.includes("output")) {
          category = "Format";
        } else if (lowerText.includes("background") || lowerText.includes("context") || lowerText.includes("history")) {
          category = "Context";
        }
        
        questions.push({
          id: `q${index}`,
          text,
          isRelevant: null,
          answer: "",
          category
        });
        index++;
      }
    }
    
    console.log(`Extracted ${questions.length} questions using regex fallback`);
    return questions;
  } catch (error) {
    console.error("Error extracting questions:", error);
    return [];
  }
}

/**
 * Extract the variables from the analysis
 */
export function extractVariables(analysis: string, promptText: string): any[] {
  try {
    // Try to find a JSON block in the analysis
    const jsonMatch = analysis.match(/```json([\s\S]*?)```/);
    
    if (jsonMatch && jsonMatch[1]) {
      // Try to parse the JSON
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed && Array.isArray(parsed.variables)) {
          console.log(`Extracted ${parsed.variables.length} variables from analysis JSON`);
          
          // Check for pre-filled variables
          const prefilledCount = parsed.variables.filter((v: any) => v.value && v.value.trim() !== "").length;
          if (prefilledCount > 0) {
            console.log(`Found ${prefilledCount} pre-filled variable values`);
          }
          
          // Ensure all variables have necessary properties
          return parsed.variables.map((v: any, index: number) => ({
            id: v.id || `v${index + 1}`,
            name: v.name || "",
            value: v.value || "",
            isRelevant: v.isRelevant === true ? true : null,
            category: v.category || "General",
            occurrences: v.occurrences || [],
            code: v.code || `VAR_${index + 1}`
          }));
        }
      } catch (e) {
        console.error("Error parsing JSON from analysis:", e);
      }
    }
    
    // Fallback: Try to extract variables using regex patterns
    const variablePattern = /(?:Variable|Var):\s*(.+?)(?:\r?\n|$)|(?:"name":\s*"(.+?)",)/g;
    const variables = [];
    let match;
    let index = 1;
    
    // Extract custom variables
    while ((match = variablePattern.exec(analysis)) !== null) {
      const name = match[1] || match[2];
      if (name) {
        // Try to extract a potential category
        let category = "General";
        const lowerName = name.toLowerCase();
        
        if (lowerName.includes("input") || lowerName.includes("data")) {
          category = "Input";
        } else if (lowerName.includes("setting") || lowerName.includes("context")) {
          category = "Setting";
        } else if (lowerName.includes("style") || lowerName.includes("tone")) {
          category = "Style";
        } else if (lowerName.includes("format") || lowerName.includes("output")) {
          category = "Format";
        } else if (lowerName.includes("subject") || lowerName.includes("topic")) {
          category = "Subject";
        }
        
        // Check for pre-filled values in the analysis
        let value = "";
        const valuePattern = new RegExp(`${name}\\s*:\\s*(.+?)(?:\\r?\\n|$)`);
        const valueMatch = analysis.match(valuePattern);
        if (valueMatch && valueMatch[1]) {
          value = valueMatch[1].trim();
        }
        
        variables.push({
          id: `v${index}`,
          name,
          value,
          isRelevant: null,
          category,
          occurrences: [],
          code: `VAR_${index}`
        });
        index++;
      }
    }
    
    // Also look for templated variables in the original prompt
    const templatePattern = /\{\{([^}]+)\}\}/g;
    while ((match = templatePattern.exec(promptText)) !== null) {
      const name = match[1].trim();
      if (name && !variables.some(v => v.name.toLowerCase() === name.toLowerCase())) {
        variables.push({
          id: `v${index}`,
          name,
          value: "",
          isRelevant: null,
          category: "Template",
          occurrences: [match[0]],
          code: `VAR_${index}`
        });
        index++;
      }
    }
    
    console.log(`Extracted ${variables.length} variables using regex fallback`);
    return variables;
  } catch (error) {
    console.error("Error extracting variables:", error);
    return [];
  }
}

/**
 * Extract the master command from the analysis
 */
export function extractMasterCommand(analysis: string): string {
  try {
    // Try to find a JSON block in the analysis
    const jsonMatch = analysis.match(/```json([\s\S]*?)```/);
    
    if (jsonMatch && jsonMatch[1]) {
      // Try to parse the JSON
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed && parsed.masterCommand) {
          return parsed.masterCommand;
        }
      } catch (e) {
        console.error("Error parsing JSON from analysis:", e);
      }
    }
    
    // Fallback: Try to extract the master command using regex patterns
    const commandPattern = /(?:Master Command|Summary|Core Intent):\s*(.+?)(?:\r?\n|$)/i;
    const match = analysis.match(commandPattern);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If we can't find anything, create a generic one based on the first sentence
    const firstSentenceMatch = analysis.match(/^(.+?[.!?])(?:\s|$)/);
    if (firstSentenceMatch && firstSentenceMatch[1]) {
      return firstSentenceMatch[1].trim();
    }
    
    return "Analyzed prompt";
  } catch (error) {
    console.error("Error extracting master command:", error);
    return "Analyzed prompt";
  }
}

/**
 * Extract the enhanced prompt from the analysis
 */
export function extractEnhancedPrompt(analysis: string): string {
  try {
    // Try to find a JSON block in the analysis
    const jsonMatch = analysis.match(/```json([\s\S]*?)```/);
    
    if (jsonMatch && jsonMatch[1]) {
      // Try to parse the JSON
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed && parsed.enhancedPrompt) {
          return parsed.enhancedPrompt;
        }
      } catch (e) {
        console.error("Error parsing JSON from analysis:", e);
      }
    }
    
    // Fallback: Try to extract the enhanced prompt using regex patterns
    const enhancedPattern = /(?:Enhanced Prompt|Improved Prompt|Optimized Prompt):\s*(.+?)(?:\r?\n\r?\n|$)/is;
    const match = analysis.match(enhancedPattern);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If nothing else works, just return a formatted version of the analysis
    return "# Enhanced Prompt\n\n" + analysis.trim();
  } catch (error) {
    console.error("Error extracting enhanced prompt:", error);
    return "# Enhanced Prompt\n\n" + analysis.trim();
  }
}
