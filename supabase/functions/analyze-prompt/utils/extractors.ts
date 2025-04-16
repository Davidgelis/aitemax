
// Functions for extracting data from AI analysis response

export const extractQuestions = (analysisText: string, originalPrompt: string) => {
  try {
    // Try to parse as JSON first
    const parsedResponse = JSON.parse(analysisText);
    if (parsedResponse && Array.isArray(parsedResponse.questions)) {
      console.log("Successfully extracted questions from JSON:", parsedResponse.questions);
      return parsedResponse.questions;
    }
  } catch (e) {
    console.warn("Could not parse response as JSON, using fallback extraction");
  }

  // Fallback to legacy format if JSON parsing fails
  try {
    const questionsMatch = analysisText.match(/CONTEXT QUESTIONS:?\s*(\[[\s\S]*?\])/);
    if (questionsMatch && questionsMatch[1]) {
      const questionsJson = questionsMatch[1].replace(/\\"/g, '"');
      const questions = JSON.parse(questionsJson);
      if (Array.isArray(questions)) {
        console.log("Successfully extracted questions from legacy format");
        return questions;
      }
    }
  } catch (e) {
    console.error("Error extracting questions from legacy format:", e);
  }

  // Generate default questions if all else fails
  console.warn("Using default questions as fallback");
  return generateDefaultQuestions(originalPrompt);
};

export const extractVariables = (analysisText: string, originalPrompt: string) => {
  try {
    // Try to parse as JSON first
    const parsedResponse = JSON.parse(analysisText);
    if (parsedResponse && Array.isArray(parsedResponse.variables)) {
      console.log("Successfully extracted variables from JSON:", parsedResponse.variables);
      return parsedResponse.variables;
    }
  } catch (e) {
    console.warn("Could not parse response as JSON, using fallback extraction");
  }

  // Fallback to legacy format if JSON parsing fails
  try {
    const variablesMatch = analysisText.match(/VARIABLES:?\s*(\[[\s\S]*?\])/);
    if (variablesMatch && variablesMatch[1]) {
      const variablesJson = variablesMatch[1].replace(/\\"/g, '"');
      const variables = JSON.parse(variablesJson);
      if (Array.isArray(variables)) {
        console.log("Successfully extracted variables from legacy format");
        return variables;
      }
    }
  } catch (e) {
    console.error("Error extracting variables from legacy format:", e);
  }

  // Generate default variables if all else fails
  console.warn("Using default variables as fallback");
  return generateDefaultVariables(originalPrompt);
};

// Helper functions for generating defaults
const generateDefaultQuestions = (originalPrompt: string) => {
  const promptLower = originalPrompt.toLowerCase();
  const questions = [];
  
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
  
  // Add context-specific questions
  if (promptLower.includes("write") || promptLower.includes("create")) {
    questions.push({
      id: "q3",
      text: "What tone and style should the content have?",
      answer: "",
      category: "Style"
    });
  }
  
  if (promptLower.includes("image") || promptLower.includes("design")) {
    questions.push({
      id: "q4",
      text: "What specific elements or style do you want to include?",
      answer: "",
      category: "Design"
    });
  }
  
  return questions;
};

const generateDefaultVariables = (originalPrompt: string) => {
  return [
    {
      id: "v1",
      name: "Tone",
      value: "",
      category: "Style"
    },
    {
      id: "v2",
      name: "Format",
      value: "",
      category: "Content"
    }
  ];
};
