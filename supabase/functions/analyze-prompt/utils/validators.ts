
export function validateQuestionVariablePairs(questions: any[], variables: any[]): boolean {
  // Log initial validation attempt
  console.log("Starting validation of questions and variables", {
    questionCount: questions?.length || 0,
    variableCount: variables?.length || 0
  });

  if (!Array.isArray(questions) || !Array.isArray(variables)) {
    console.error("Invalid input: questions and variables must be arrays", {
      questions: typeof questions,
      variables: typeof variables
    });
    return false;
  }

  // Validate questions format
  for (const question of questions) {
    if (!question.id || !question.text || !question.category) {
      console.error("Invalid question format:", question);
      return false;
    }
  }

  // Validate variables format
  for (const variable of variables) {
    if (!variable.id || !variable.name || !variable.category) {
      console.error("Invalid variable format:", variable);
      return false;
    }
  }

  // Ensure minimum required questions and variables
  if (questions.length < 2) {
    console.error("Not enough questions provided (minimum 2)");
    return false;
  }

  if (variables.length < 1) {
    console.error("Not enough variables provided (minimum 1)");
    return false;
  }

  console.log("Validation successful", {
    questions: questions.length,
    variables: variables.length
  });

  return true;
}
