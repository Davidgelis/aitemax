
export const extractQuestions = (analysisText: string, originalPrompt: string) => {
  console.log("Extracting questions from analysis text");
  
  try {
    const parsedResponse = JSON.parse(analysisText);
    if (parsedResponse && Array.isArray(parsedResponse.questions)) {
      const questions = parsedResponse.questions.map(q => ({
        ...q,
        answer: q.answer || ""
      }));
      console.log("Successfully extracted questions:", questions.length);
      return questions;
    }
    
    throw new Error("Invalid questions format in response");
  } catch (e) {
    console.error("Error extracting questions:", e);
    // Return default questions as fallback
    return [
      {
        id: "q1",
        text: "What is the main purpose or goal you want to achieve?",
        answer: "",
        category: "Intent"
      },
      {
        id: "q2",
        text: "What specific details or requirements are important?",
        answer: "",
        category: "Details"
      }
    ];
  }
};

export const extractVariables = (analysisText: string, originalPrompt: string) => {
  console.log("Extracting variables from analysis text");
  
  try {
    const parsedResponse = JSON.parse(analysisText);
    if (parsedResponse && Array.isArray(parsedResponse.variables)) {
      const variables = parsedResponse.variables.map(v => ({
        ...v,
        value: v.value || "",
        isRelevant: null
      }));
      console.log("Successfully extracted variables:", variables.length);
      return variables;
    }
    
    throw new Error("Invalid variables format in response");
  } catch (e) {
    console.error("Error extracting variables:", e);
    // Return default variables as fallback
    return [
      {
        id: "v1",
        name: "Format",
        value: "",
        category: "Style",
        isRelevant: null
      },
      {
        id: "v2",
        name: "Tone",
        value: "",
        category: "Style",
        isRelevant: null
      }
    ];
  }
};
