
// Function to extract questions from the AI analysis
export function extractQuestions(analysis: string, originalPrompt: string): any[] {
  try {
    // Attempt to parse as JSON first
    const jsonMatch = analysis.match(/\{[\s\S]*"contextQuestions":\s*(\[[\s\S]*?\])[\s\S]*\}/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const questionsJson = jsonMatch[1].replace(/,\s*\]/, ']'); // Fix trailing commas
        const questions = JSON.parse(questionsJson);
        
        // Validate each question has required fields
        return questions.map((q: any, index: number) => {
          return {
            id: q.id || `q${index + 1}`,
            text: q.text || `Question ${index + 1}`,
            answer: q.answer || "",
            isRelevant: null,
            category: q.category || "General",
            prefillSource: q.prefillSource || null  // Extract prefill source if available
          };
        });
      } catch (e) {
        console.error("Error parsing contextQuestions JSON:", e);
      }
    }
    
    // If JSON parsing fails, try regex-based extraction
    const questionsSection = analysis.match(/CONTEXT QUESTIONS:?\s*([\s\S]*?)(?=VARIABLES:|MASTER COMMAND:|ENHANCED PROMPT:|$)/i);
    
    if (questionsSection && questionsSection[1]) {
      // Extract questions using regex
      const questionMatches = questionsSection[1].match(/(?:^|\n)(?:\d+[\.\)]\s*|\*\s*|\-\s*|(?:Q|Question)\s*\d+[\.\)]\s*)([^\n]+)/gi);
      
      if (questionMatches && questionMatches.length > 0) {
        return questionMatches.map((q, index) => {
          const cleanedQuestion = q.replace(/^(?:\d+[\.\)]\s*|\*\s*|\-\s*|(?:Q|Question)\s*\d+[\.\)]\s*)/i, '').trim();
          return {
            id: `q${index + 1}`,
            text: cleanedQuestion,
            answer: "",
            isRelevant: null,
            category: "General"
          };
        });
      }
    }
    
    // If all else fails, return default questions
    console.warn("Failed to extract questions, generating default questions based on prompt");
    return generateDefaultQuestions(originalPrompt);
  } catch (error) {
    console.error("Error extracting questions:", error);
    return generateDefaultQuestions(originalPrompt);
  }
}

// Function to extract variables from the AI analysis
export function extractVariables(analysis: string, originalPrompt: string): any[] {
  try {
    // Attempt to parse as JSON first
    const jsonMatch = analysis.match(/\{[\s\S]*"variables":\s*(\[[\s\S]*?\])[\s\S]*\}/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const variablesJson = jsonMatch[1].replace(/,\s*\]/, ']'); // Fix trailing commas
        const variables = JSON.parse(variablesJson);
        
        // Validate each variable has required fields
        return variables.map((v: any, index: number) => {
          return {
            id: v.id || `v${index + 1}`,
            name: v.name || `Variable${index + 1}`,
            value: v.value || "",
            isRelevant: null,
            category: v.category || "Other",
            prefillSource: v.prefillSource || null  // Extract prefill source if available
          };
        });
      } catch (e) {
        console.error("Error parsing variables JSON:", e);
      }
    }
    
    // If JSON parsing fails, try regex-based extraction
    const variablesSection = analysis.match(/VARIABLES:?\s*([\s\S]*?)(?=CONTEXT QUESTIONS:|MASTER COMMAND:|ENHANCED PROMPT:|$)/i);
    
    if (variablesSection && variablesSection[1]) {
      // Extract variables using regex
      const variableMatches = variablesSection[1].match(/(?:^|\n)(?:\d+[\.\)]\s*|\*\s*|\-\s*)([^\n:]+):?([^\n]*)/gi);
      
      if (variableMatches && variableMatches.length > 0) {
        return variableMatches.map((v, index) => {
          const match = v.match(/(?:\d+[\.\)]\s*|\*\s*|\-\s*)([^\n:]+):?([^\n]*)/i);
          if (match) {
            const name = match[1].trim();
            const value = match[2].trim();
            return {
              id: `v${index + 1}`,
              name,
              value,
              isRelevant: null,
              category: "Other"
            };
          }
          return {
            id: `v${index + 1}`,
            name: `Variable${index + 1}`,
            value: "",
            isRelevant: null,
            category: "Other"
          };
        });
      }
    }
    
    // If all else fails, return default variables
    console.warn("Failed to extract variables, generating default variables based on prompt");
    return generateDefaultVariables(originalPrompt);
  } catch (error) {
    console.error("Error extracting variables:", error);
    return generateDefaultVariables(originalPrompt);
  }
}

// Function to extract the master command from the AI analysis
export function extractMasterCommand(analysis: string): string {
  try {
    // Try to extract from JSON first
    const jsonMatch = analysis.match(/\{[\s\S]*"masterCommand":\s*"([^"]+)"[\s\S]*\}/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1];
    }
    
    // If that fails, try regex
    const commandSection = analysis.match(/MASTER COMMAND:?\s*([\s\S]*?)(?=CONTEXT QUESTIONS:|VARIABLES:|ENHANCED PROMPT:|$)/i);
    
    if (commandSection && commandSection[1]) {
      return commandSection[1].trim();
    }
    
    return "Analyze and enhance the provided prompt";
  } catch (error) {
    console.error("Error extracting master command:", error);
    return "Analyze and enhance the provided prompt";
  }
}

// Function to extract the enhanced prompt from the AI analysis
export function extractEnhancedPrompt(analysis: string): string {
  try {
    // Try to extract from JSON first
    const jsonMatch = analysis.match(/\{[\s\S]*"enhancedPrompt":\s*"([\s\S]*?)"(?:,|\})(?:[\s\S]*\}|$)/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
    
    // If that fails, try regex
    const promptSection = analysis.match(/ENHANCED PROMPT:?\s*([\s\S]*?)(?=CONTEXT QUESTIONS:|VARIABLES:|MASTER COMMAND:|$)/i);
    
    if (promptSection && promptSection[1]) {
      return promptSection[1].trim();
    }
    
    return "# Enhanced Prompt\n\nPlease provide more context to enhance this prompt.";
  } catch (error) {
    console.error("Error extracting enhanced prompt:", error);
    return "# Enhanced Prompt\n\nPlease provide more context to enhance this prompt.";
  }
}

// Helper function to generate default questions based on prompt text
function generateDefaultQuestions(promptText: string): any[] {
  const defaultQuestions = [
    {
      id: "q1",
      text: "What is the primary purpose or goal you want to achieve?",
      answer: "",
      isRelevant: null,
      category: "Purpose"
    },
    {
      id: "q2",
      text: "Who is the intended audience for this content?",
      answer: "",
      isRelevant: null,
      category: "Audience"
    },
    {
      id: "q3",
      text: "What tone or style would be most appropriate?",
      answer: "",
      isRelevant: null,
      category: "Style"
    },
    {
      id: "q4",
      text: "What specific details or information must be included?",
      answer: "",
      isRelevant: null,
      category: "Content"
    },
    {
      id: "q5",
      text: "Are there any examples or references you'd like to follow?",
      answer: "",
      isRelevant: null,
      category: "References"
    }
  ];
  
  return defaultQuestions;
}

// Helper function to generate default variables based on prompt text
function generateDefaultVariables(promptText: string): any[] {
  const defaultVariables = [
    {
      id: "v1",
      name: "Audience",
      value: "",
      isRelevant: null,
      category: "Targeting"
    },
    {
      id: "v2",
      name: "Tone",
      value: "",
      isRelevant: null,
      category: "Style"
    },
    {
      id: "v3",
      name: "Format",
      value: "",
      isRelevant: null,
      category: "Structure"
    },
    {
      id: "v4",
      name: "KeyPoints",
      value: "",
      isRelevant: null,
      category: "Content"
    }
  ];
  
  return defaultVariables;
}
