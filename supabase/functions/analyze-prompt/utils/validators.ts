
// Functions for validating questions and variables

export function validateQuestionVariablePairs(questions: any[], variables: any[]): boolean {
  if (!Array.isArray(questions) || !Array.isArray(variables)) {
    console.error("Invalid input: questions and variables must be arrays");
    return false;
  }

  // Validate questions format
  for (const question of questions) {
    if (!question.id || !question.text) {
      console.error("Invalid question format:", question);
      return false;
    }
  }

  // Validate variables format
  for (const variable of variables) {
    if (!variable.id || !variable.name) {
      console.error("Invalid variable format:", variable);
      return false;
    }
  }

  // Check for duplicate IDs
  const questionIds = new Set(questions.map(q => q.id));
  const variableIds = new Set(variables.map(v => v.id));
  
  if (questionIds.size !== questions.length) {
    console.error("Duplicate question IDs found");
    return false;
  }
  
  if (variableIds.size !== variables.length) {
    console.error("Duplicate variable IDs found");
    return false;
  }

  return true;
}
