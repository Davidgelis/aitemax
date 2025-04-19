// Functions for extracting data from AI analysis response

// Function to extract questions from the AI analysis
export const extractQuestions = (analysisText: string, originalPrompt: string) => {
  try {
    // Try to parse the entire response as JSON
    const parsedResponse = JSON.parse(analysisText);
    if (parsedResponse && Array.isArray(parsedResponse.contextQuestions)) {
      console.log("Successfully extracted questions from JSON response");
      
      // Validate questions have proper category assignments
      const enhancedQuestions = parsedResponse.contextQuestions.map(q => {
        // Ensure question has a valid category
        if (!q.category) {
          console.warn(`Question missing category: ${q.text}`);
          q.category = 'Other';
        }

        // Check if answer contains generic references and flag it
        const hasGenericReference = q.answer && (
          q.answer.includes("the image shows") || 
          q.answer.includes("the website mentions") || 
          q.answer.includes("the provided context") ||
          q.answer.includes("based on the context")
        );
        
        if (hasGenericReference) {
          console.warn("Question answer contains generic references:", q.text);
        }
        
        return {
          ...q,
          // Add metadata about answer quality
          answerQuality: hasGenericReference ? "generic" : "detailed"
        };
      });
      
      return enhancedQuestions;
    }
  } catch (e) {
    console.error("Error parsing JSON response:", e);
  }

  // If direct JSON parsing didn't work, try to extract the questions section
  try {
    const questionsMatch = analysisText.match(/\"contextQuestions\"\s*:\s*(\[[\s\S]*?\])/);
    if (questionsMatch && questionsMatch[1]) {
      const questionsJson = questionsMatch[1].replace(/\\"/g, '"');
      const questions = JSON.parse(questionsJson);
      if (Array.isArray(questions)) {
        console.log("Successfully extracted questions from contextQuestions section");
        return questions;
      }
    }
  } catch (e) {
    console.error("Error extracting questions from contextQuestions section:", e);
  }

  // Fallback to legacy format if needed
  try {
    const questionsMatch = analysisText.match(/CONTEXT QUESTIONS:?\s*(\[[\s\S]*?\])/);
    if (questionsMatch && questionsMatch[1]) {
      const questionsJson = questionsMatch[1].replace(/\\"/g, '"');
      const questions = JSON.parse(questionsJson);
      if (Array.isArray(questions)) {
        console.log("Successfully extracted questions from CONTEXT QUESTIONS section");
        return questions;
      }
    }
  } catch (e) {
    console.error("Error extracting questions from legacy format:", e);
  }

  // If we get here, use some default questions based on the original prompt
  console.warn("Falling back to generating default questions based on prompt");
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

// Helper function to generate default questions based on the original prompt
const generateDefaultQuestions = (originalPrompt: string) => {
  const prompt = originalPrompt.toLowerCase();
  const questions = [];
  
  // Add general intent questions first
  questions.push({
    id: "q1",
    text: "What is the main purpose or goal you want to achieve?",
    answer: "",
    category: "Intent"
  });
  
  questions.push({
    id: "q2",
    text: "Who is the target audience for this content?",
    answer: "",
    category: "Audience"
  });
  
  // Check for content creation intent
  if (prompt.includes("write") || prompt.includes("create") || prompt.includes("generate content")) {
    questions.push({
      id: "q3",
      text: "What tone and style should the content have?",
      answer: "",
      category: "Style"
    });
    
    questions.push({
      id: "q4",
      text: "What is the preferred length or format for this content?",
      answer: "",
      category: "Format"
    });
  }
  
  // Check for image generation intent
  if (prompt.includes("image") || prompt.includes("picture") || prompt.includes("design")) {
    questions.push({
      id: "q3",
      text: "What style, mood, or aesthetic are you looking for?",
      answer: "",
      category: "Style"
    });
    
    questions.push({
      id: "q4",
      text: "What specific elements should be included in the image?",
      answer: "",
      category: "Content"
    });
  }
  
  // Check for research intent
  if (prompt.includes("research") || prompt.includes("analyze") || prompt.includes("study")) {
    questions.push({
      id: "q3",
      text: "What specific aspects do you want researched?",
      answer: "",
      category: "Scope"
    });
    
    questions.push({
      id: "q4",
      text: "What level of detail do you need in the research?",
      answer: "",
      category: "Depth"
    });
  }
  
  // Add general fallback questions
  questions.push({
    id: "q5",
    text: "Are there any specific examples or references you want to follow?",
    answer: "",
    category: "Reference"
  });
  
  questions.push({
    id: "q6",
    text: "Are there any specific constraints or requirements to consider?",
    answer: "",
    category: "Constraints"
  });
  
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
