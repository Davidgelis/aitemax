
export function validateQuestionVariablePairs(questions: any[], variables: any[]): boolean {
  // Improved logging with pillar tracking
  console.log("Starting validation of questions and variables", {
    questionCount: questions?.length || 0,
    variableCount: variables?.length || 0,
    pillars: questions?.reduce((acc: Record<string, number>, q: any) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {})
  });

  if (!Array.isArray(questions) || !Array.isArray(variables)) {
    console.error("Invalid input: questions and variables must be arrays", {
      questions: typeof questions,
      variables: typeof variables
    });
    return false;
  }

  // Validate questions format and pillar alignment
  for (const question of questions) {
    if (!question.id || !question.text || !question.category) {
      console.error("Invalid question format:", question);
      return false;
    }

    // Validate pillar categories
    if (!["Task", "Persona", "Conditions", "Instructions"].includes(question.category)) {
      console.error("Invalid question category (must match framework pillars):", question.category);
      return false;
    }
  }

  // Check pillar distribution
  const pillarCounts = questions.reduce((acc: Record<string, number>, q: any) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});

  // Log pillar distribution
  console.log("Questions per pillar:", pillarCounts);

  // Ensure no pillar has more than 4 questions
  for (const [pillar, count] of Object.entries(pillarCounts)) {
    if (count > 4) {
      console.error(`Too many questions (${count}) for pillar: ${pillar}`);
      return false;
    }
  }

  // Validate variables format and count
  if (variables.length > 8) {
    console.error("Too many variables provided (maximum 8)");
    return false;
  }

  for (const variable of variables) {
    if (!variable.id || !variable.name || !variable.category) {
      console.error("Invalid variable format:", variable);
      return false;
    }
  }

  // Check for duplicate context between questions and variables
  const questionTexts = questions.map(q => q.text.toLowerCase());
  const variableNames = variables.map(v => v.name.toLowerCase());

  for (const vName of variableNames) {
    for (const qText of questionTexts) {
      if (qText.includes(vName) || vName.includes(qText)) {
        console.warn("Potential duplicate context between question and variable:", {
          questionText: qText,
          variableName: vName
        });
      }
    }
  }

  console.log("Validation successful", {
    questions: questions.length,
    variables: variables.length,
    pillarsUsed: Object.keys(pillarCounts).length
  });

  return true;
}
