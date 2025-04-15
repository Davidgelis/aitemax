
export function validateQuestionVariablePairs(questions: any[], variables: any[]): boolean {
  // Extract variable names and convert to lowercase for comparison
  const variableNames = variables.map(v => v.name.toLowerCase());
  
  // Check each question to ensure it's not directly asking for a variable value
  // and follows user-friendly guidelines
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
    
    // Validate question follows user-friendly guidelines
    const hasExample = question.text.includes('(') && question.text.includes(')');
    const hasTechnicalJargon = /\b(api|sdk|oauth|jwt|sql|regex|kubernetes|docker)\b/i.test(questionLower);
    
    // If technical jargon is present but no example is provided
    if (hasTechnicalJargon && !hasExample) {
      console.warn(`Question "${question.text}" contains technical terms without examples`);
      return false;
    }
  }
  
  return true;
}

