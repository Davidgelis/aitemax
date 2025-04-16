
export const extractQuestions = (analysisText: string, originalPrompt: string) => {
  console.log("Extracting questions from analysis text");
  
  try {
    const parsedResponse = JSON.parse(analysisText);
    if (parsedResponse && Array.isArray(parsedResponse.questions)) {
      // Filter to maximum 4 questions per pillar
      const questionsByPillar: Record<string, any[]> = {};
      
      parsedResponse.questions.forEach(q => {
        if (!questionsByPillar[q.category]) {
          questionsByPillar[q.category] = [];
        }
        if (questionsByPillar[q.category].length < 4) {
          questionsByPillar[q.category].push({
            ...q,
            answer: q.answer || ""
          });
        }
      });
      
      // Flatten the filtered questions
      const questions = Object.values(questionsByPillar).flat();
      
      console.log("Successfully extracted questions:", {
        total: questions.length,
        byPillar: Object.fromEntries(
          Object.entries(questionsByPillar).map(([k, v]) => [k, v.length])
        )
      });
      
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
        category: "Task"
      },
      {
        id: "q2",
        text: "What specific requirements are important?",
        answer: "",
        category: "Conditions"
      }
    ];
  }
};

export const extractVariables = (analysisText: string, originalPrompt: string) => {
  console.log("Extracting variables from analysis text");
  
  try {
    const parsedResponse = JSON.parse(analysisText);
    if (parsedResponse && Array.isArray(parsedResponse.variables)) {
      // Limit to maximum 8 variables
      const variables = parsedResponse.variables
        .slice(0, 8)
        .map(v => ({
          ...v,
          value: v.value || "",
          isRelevant: null
        }));
      
      console.log("Successfully extracted variables:", {
        count: variables.length,
        categories: variables.reduce((acc: Record<string, number>, v) => {
          acc[v.category] = (acc[v.category] || 0) + 1;
          return acc;
        }, {})
      });
      
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
      }
    ];
  }
};
