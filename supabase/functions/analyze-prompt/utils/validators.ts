
// Functions for validating questions and variables

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
    
    // Define common technical terms that need explanation
    const technicalTerms = {
      api: "Application Programming Interface",
      sdk: "Software Development Kit",
      oauth: "Open Authentication",
      jwt: "JSON Web Token",
      sql: "Structured Query Language",
      regex: "Regular Expression",
      kubernetes: "Container Orchestration System",
      docker: "Container Platform"
    };
    
    // Check for technical terms and ensure they have explanations
    const foundTechnicalTerms = Object.entries(technicalTerms).reduce((terms: any[], [term, fullName]) => {
      if (questionLower.includes(term)) {
        terms.push({
          term,
          explanation: `${fullName} - A technical tool that helps with ${term === 'api' ? 'connecting different software systems' : 
            term === 'sdk' ? 'building software applications' :
            term === 'oauth' ? 'secure login systems' :
            term === 'jwt' ? 'secure data transfer' :
            term === 'sql' ? 'managing database information' :
            term === 'regex' ? 'finding patterns in text' :
            term === 'kubernetes' ? 'managing large applications' :
            term === 'docker' ? 'packaging applications' : 'technical operations'}`,
          example: `For example: ${
            term === 'api' ? 'connecting to a weather service to get today\'s forecast' :
            term === 'sdk' ? 'tools that help create mobile apps' :
            term === 'oauth' ? 'logging in with your Google account' :
            term === 'jwt' ? 'securely remembering who you are while using an app' :
            term === 'sql' ? 'finding all orders from the last month' :
            term === 'regex' ? 'checking if an email address is valid' :
            term === 'kubernetes' ? 'running a website that can handle millions of users' :
            term === 'docker' ? 'making sure an app works the same on any computer' : ''
          }`
        });
      }
      return terms;
    }, []);
    
    if (foundTechnicalTerms.length > 0) {
      question.technicalTerms = foundTechnicalTerms;
    }
    
    // If technical jargon is present but no example is provided
    if (foundTechnicalTerms.length > 0 && !hasExample) {
      console.warn(`Question "${question.text}" contains technical terms without examples`);
      return false;
    }
  }
  
  return true;
}

