
export function validateQuestionVariablePairs(questions: any[], variables: any[]): boolean {
  // Extract variable names and convert to lowercase for comparison
  const variableNames = variables.map(v => v.name.toLowerCase());
  
  // Check each question to ensure it's not directly asking for a variable value
  for (const question of questions) {
    const questionLower = question.text.toLowerCase();
    
    // Check if question directly asks for any variable
    for (const varName of variableNames) {
      const varNameWords = varName.split(/(?=[A-Z])|_|\s/).map(w => w.toLowerCase());
      
      // Common question patterns that directly ask for variables
      const directPatterns = [
        `what ${varNameWords.join(' ')}`,
        `which ${varNameWords.join(' ')}`,
        `specify ${varNameWords.join(' ')}`,
        `select ${varNameWords.join(' ')}`,
        `choose ${varNameWords.join(' ')}`,
        `define ${varNameWords.join(' ')}`
      ];
      
      if (directPatterns.some(pattern => questionLower.includes(pattern))) {
        console.warn(`Question "${question.text}" directly asks for variable "${varName}"`);
        return false;
      }
    }
  }
  
  return true;
}
