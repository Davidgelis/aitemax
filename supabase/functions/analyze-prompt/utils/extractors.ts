// Functions for extracting data from AI analysis response

// Function to extract questions from the AI analysis
export const extractQuestions = (analysisText: string, originalPrompt: string) => {
  try {
    // Try to parse the entire response as JSON
    console.log("Attempting to parse AI response as JSON");
    const parsedResponse = JSON.parse(analysisText);
    
    if (parsedResponse && Array.isArray(parsedResponse.contextQuestions)) {
      console.log("Successfully extracted questions from JSON response");
      console.log("Questions by category:", parsedResponse.contextQuestions.reduce((acc: any, q: any) => {
        acc[q.category] = (acc[q.category] || 0) + 1;
        return acc;
      }, {}));
      
      // Validate questions have proper category assignments
      const enhancedQuestions = parsedResponse.contextQuestions.map(q => {
        // Ensure question has a valid category and structure
        if (!q.category) {
          console.warn(`Question missing category, text: "${q.text}"`);
          q.category = 'Other';
        }

        // Validate question structure
        const validatedQuestion = {
          id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
          text: q.text,
          answer: q.answer || "",
          isRelevant: q.isRelevant ?? null,
          category: q.category,
          technicalTerms: Array.isArray(q.technicalTerms) ? q.technicalTerms : []
        };

        return validatedQuestion;
      });
      
      console.log(`Processed ${enhancedQuestions.length} questions across ${new Set(enhancedQuestions.map(q => q.category)).size} categories`);
      return enhancedQuestions;
    }
  } catch (e) {
    console.error("Error parsing JSON response:", e);
  }

  // If JSON parsing didn't work, try to extract questions section
  try {
    console.log("Attempting to extract questions from structured text");
    const questionsMatch = analysisText.match(/\"contextQuestions\"\s*:\s*(\[[\s\S]*?\])/);
    if (questionsMatch && questionsMatch[1]) {
      const questionsJson = questionsMatch[1].replace(/\\"/g, '"');
      const questions = JSON.parse(questionsJson);
      if (Array.isArray(questions)) {
        console.log("Successfully extracted questions from contextQuestions section");
        return questions.map(q => ({
          ...q,
          category: q.category || 'Other',
          isRelevant: q.isRelevant ?? null,
          answer: q.answer || ""
        }));
      }
    }
  } catch (e) {
    console.error("Error extracting questions from structured text:", e);
  }

  // Fallback to generating default questions based on template if available
  console.warn("Using fallback question generation");
  return generateDefaultQuestions(originalPrompt);
};

// Function to extract variables from the AI analysis
export const extractVariables = (analysisText: string, originalPrompt: string) => {
  try {
    // Try to parse the entire response as JSON
    const parsedResponse = JSON.parse(analysisText);
    if (parsedResponse && Array.isArray(parsedResponse.variables)) {
      console.log("Successfully extracted variables from JSON response");
      
      // Validate variable values for length and specificity
      const enhancedVariables = parsedResponse.variables.map(v => {
        // Check if the value is too long (more than 4 words)
        const wordCount = v.value ? v.value.split(/\s+/).filter(Boolean).length : 0;
        const isTooLong = wordCount > 4;
        
        if (isTooLong) {
          console.warn(`Variable ${v.name} has too many words (${wordCount}): "${v.value}"`);
          // Truncate to first 4 words if too long
          const truncatedValue = v.value.split(/\s+/).filter(Boolean).slice(0, 4).join(" ");
          return {
            ...v,
            originalValue: v.value,
            value: truncatedValue,
            valueQuality: "truncated"
          };
        }
        
        return {
          ...v,
          valueQuality: "appropriate"
        };
      });
      
      return enhancedVariables;
    }
  } catch (e) {
    // If JSON parsing fails, use regex extraction as fallback
    console.log("Using regex fallback for extracting variables");
  }

  // If direct JSON parsing didn't work, try to extract the variables section
  try {
    const variablesMatch = analysisText.match(/\"variables\"\s*:\s*(\[[\s\S]*?\])/);
    if (variablesMatch && variablesMatch[1]) {
      const variablesJson = variablesMatch[1].replace(/\\"/g, '"');
      const variables = JSON.parse(variablesJson);
      if (Array.isArray(variables)) {
        console.log("Successfully extracted variables from variables section");
        return variables;
      }
    }
  } catch (e) {
    console.error("Error extracting variables from variables section:", e);
  }

  // Fallback to legacy format if needed
  try {
    const variablesMatch = analysisText.match(/VARIABLES:?\s*(\[[\s\S]*?\])/);
    if (variablesMatch && variablesMatch[1]) {
      const variablesJson = variablesMatch[1].replace(/\\"/g, '"');
      const variables = JSON.parse(variablesJson);
      if (Array.isArray(variables)) {
        console.log("Successfully extracted variables from VARIABLES section");
        return variables;
      }
    }
  } catch (e) {
    console.error("Error extracting variables from legacy format:", e);
  }

  // If we get here, use some default variables based on the original prompt
  console.warn("Falling back to generating default variables based on prompt");
  return generateDefaultVariables(originalPrompt);
};

// Function to extract master command from the AI analysis
export const extractMasterCommand = (analysisText: string) => {
  try {
    // Try to parse the entire response as JSON
    const parsedResponse = JSON.parse(analysisText);
    if (parsedResponse && parsedResponse.masterCommand) {
      return parsedResponse.masterCommand;
    }
  } catch (e) {
    // If JSON parsing fails, use regex extraction as fallback
  }

  // Try to extract using regex
  const masterCommandMatch = analysisText.match(/\"masterCommand\"\s*:\s*\"([^\"]+)\"/);
  if (masterCommandMatch && masterCommandMatch[1]) {
    return masterCommandMatch[1];
  }

  // Fallback to legacy format if needed
  const legacyMatch = analysisText.match(/MASTER COMMAND:?\s*(.+?)(?:\n|$)/);
  if (legacyMatch && legacyMatch[1]) {
    return legacyMatch[1].trim();
  }

  return "Analyze and enhance this prompt";
};

// Function to extract enhanced prompt from the AI analysis
export const extractEnhancedPrompt = (analysisText: string) => {
  try {
    // Try to parse the entire response as JSON
    const parsedResponse = JSON.parse(analysisText);
    if (parsedResponse && parsedResponse.enhancedPrompt) {
      return parsedResponse.enhancedPrompt;
    }
  } catch (e) {
    // If JSON parsing fails, use regex extraction as fallback
  }

  // Try to extract using regex
  const enhancedPromptMatch = analysisText.match(/\"enhancedPrompt\"\s*:\s*\"([\s\S]*?)\"/);
  if (enhancedPromptMatch && enhancedPromptMatch[1]) {
    return enhancedPromptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }

  // Fallback to legacy format if needed
  const legacyMatch = analysisText.match(/ENHANCED PROMPT:?\s*([\s\S]*?)(?:$|RESPONSE FORMAT)/);
  if (legacyMatch && legacyMatch[1]) {
    return legacyMatch[1].trim();
  }

  return "# Enhanced Prompt\n\nThis is an enhanced version of your original prompt.";
};

// Updated helper function to generate default questions based on the original prompt
const generateDefaultQuestions = (originalPrompt: string) => {
  console.log("Generating default questions for prompt");
  const prompt = originalPrompt.toLowerCase();
  
  // Base questions that apply to any prompt
  const questions = [
    {
      id: "q1",
      text: "What is the main objective or goal you want to achieve?",
      answer: "",
      isRelevant: null,
      category: "Task",
      technicalTerms: []
    },
    {
      id: "q2",
      text: "Who is the target audience for this content?",
      answer: "",
      isRelevant: null,
      category: "Audience",
      technicalTerms: []
    }
  ];
  
  // Add additional questions based on prompt content
  if (prompt.includes("write") || prompt.includes("create") || prompt.includes("generate")) {
    questions.push({
      id: "q3",
      text: "What tone and style should the content have?",
      answer: "",
      isRelevant: null,
      category: "Style",
      technicalTerms: []
    });
  }
  
  if (prompt.includes("analyze") || prompt.includes("research")) {
    questions.push({
      id: "q4",
      text: "What specific aspects need to be analyzed?",
      answer: "",
      isRelevant: null,
      category: "Analysis",
      technicalTerms: []
    });
  }
  
  console.log(`Generated ${questions.length} default questions`);
  return questions;
};

// Helper function to generate default variables based on the original prompt
const generateDefaultVariables = (originalPrompt: string) => {
  const prompt = originalPrompt.toLowerCase();
  const variables = [];
  
  // Add universal variables
  variables.push({
    id: "v1",
    name: "Tone",
    value: "",
    category: "Style"
  });
  
  variables.push({
    id: "v2",
    name: "DetailLevel",
    value: "",
    category: "Content"
  });
  
  // Content-specific variables
  if (prompt.includes("write") || prompt.includes("create") || prompt.includes("generate content")) {
    variables.push({
      id: "v3",
      name: "ContentFormat",
      value: "",
      category: "Format"
    });
    
    variables.push({
      id: "v4",
      name: "KeyPoints",
      value: "",
      category: "Content"
    });
  }
  
  // Image-specific variables
  if (prompt.includes("image") || prompt.includes("picture") || prompt.includes("design")) {
    variables.push({
      id: "v3",
      name: "ImageStyle",
      value: "",
      category: "Style"
    });
    
    variables.push({
      id: "v4",
      name: "ColorPalette",
      value: "",
      category: "Design"
    });
  }
  
  // Research-specific variables
  if (prompt.includes("research") || prompt.includes("analyze") || prompt.includes("study")) {
    variables.push({
      id: "v3",
      name: "ResearchDepth",
      value: "",
      category: "Depth"
    });
    
    variables.push({
      id: "v4",
      name: "DataSources",
      value: "",
      category: "Sources"
    });
  }
  
  return variables;
};
