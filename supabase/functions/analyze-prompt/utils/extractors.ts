
// Helper functions to extract structured data from AI analysis

/**
 * Determine category based on question text
 */
export function getCategoryFromText(text: string): string {
  text = text.toLowerCase();
  
  if (text.includes("what") || text.includes("goal") || text.includes("objective") || text.includes("accomplish")) {
    return "Task";
  } else if (text.includes("who") || text.includes("audience") || text.includes("tone") || text.includes("persona")) {
    return "Persona";
  } else if (text.includes("limit") || text.includes("constraint") || text.includes("avoid") || text.includes("how long") || text.includes("word count")) {
    return "Conditions";
  } else {
    return "Instructions";
  }
}

/**
 * Determine category based on variable name
 */
export function getCategoryFromVariableName(name: string): string {
  name = name.toLowerCase();
  
  // More specific variable categorization
  if (name.includes("recipient") || name.includes("audience") || name.includes("user") || name.includes("tone") || name.includes("voice")) {
    return "Persona";
  } else if (name.includes("count") || name.includes("limit") || name.includes("length") || name.includes("number") || name.includes("time")) {
    return "Conditions";
  } else if (name.includes("format") || name.includes("step") || name.includes("signature") || name.includes("style") || name.includes("method")) {
    return "Instructions";
  } else {
    return "Task";
  }
}

/**
 * Extract questions from AI analysis
 */
export function extractQuestions(analysis: string, promptText: string): any[] {
  // Try to find a JSON block containing questions
  const jsonMatch = analysis.match(/```json\s*({[\s\S]*?})\s*```/);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsedJson = JSON.parse(jsonMatch[1]);
      if (parsedJson.questions && Array.isArray(parsedJson.questions)) {
        return parsedJson.questions.map((q: any, i: number) => ({
          id: q.id || `q${i+1}`,
          text: q.text,
          category: q.category || getCategoryFromText(q.text),
          isRelevant: null,
          answer: ""
        }));
      }
    } catch (e) {
      console.error("Error parsing JSON from analysis:", e);
    }
  }
  
  // Fallback: Look for questions with regex
  const questions = [];
  const questionMatches = analysis.matchAll(/(?:Question|Q)(?:\s+\d+)?(?:\s*\(([^)]+)\))?:\s*(.+?)(?=\n|$)/g);
  
  for (const match of questionMatches) {
    const category = match[1] || getCategoryFromText(match[2]);
    const text = match[2].trim();
    
    if (text) {
      questions.push({
        id: `q${questions.length + 1}`,
        text,
        category,
        isRelevant: null,
        answer: ""
      });
    }
  }
  
  if (questions.length > 0) {
    return questions;
  }
  
  // If still no questions found, look for bullet points that end with question marks
  const bulletQuestionMatches = analysis.matchAll(/(?:[-*•]\s*)(.+?\?)/g);
  
  for (const match of bulletQuestionMatches) {
    const text = match[1].trim();
    
    if (text) {
      questions.push({
        id: `q${questions.length + 1}`,
        text,
        category: getCategoryFromText(text),
        isRelevant: null,
        answer: ""
      });
    }
  }
  
  return questions.length > 0 ? questions : generateContextQuestionsForPrompt(promptText);
}

/**
 * Extract variables from AI analysis
 */
export function extractVariables(analysis: string, promptText: string): any[] {
  // Direct extraction of variables from prompt to ensure they're always captured
  const directVariables = extractDirectVariablesFromPrompt(promptText);
  if (directVariables.length > 0) {
    return directVariables;
  }
  
  // Try to find a JSON block containing variables
  const jsonMatch = analysis.match(/```json\s*({[\s\S]*?})\s*```/);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsedJson = JSON.parse(jsonMatch[1]);
      if (parsedJson.variables && Array.isArray(parsedJson.variables)) {
        // Filter out any variables that match category names or have invalid names
        return parsedJson.variables
          .filter((v: any) => 
            v.name && 
            v.name.trim().length > 1 &&  // Must be more than a single character
            !/^\*+$/.test(v.name) &&     // Must not be just asterisks
            !/^[sS]$/.test(v.name) &&    // Must not be just 's' 
            v.name !== 'Task' && 
            v.name !== 'Persona' && 
            v.name !== 'Conditions' && 
            v.name !== 'Instructions')
          .map((v: any, i: number) => ({
            id: v.id || `v${i+1}`,
            name: v.name,
            value: v.value || "",
            isRelevant: true, // Mark as relevant by default
            category: v.category || getCategoryFromVariableName(v.name)
          }));
      }
    } catch (e) {
      console.error("Error parsing JSON from analysis:", e);
    }
  }
  
  // Check for variable patterns like {{VariableName}}
  let enhancedPrompt = extractEnhancedPrompt(analysis);
  const contextualVariables = extractDirectVariablesFromPrompt(enhancedPrompt);
  
  if (contextualVariables.length > 0) {
    return contextualVariables;
  }
  
  // Fallback: Look for variable definitions in the text
  const variables = [];
  // Look for lines like "Variable: Name = Value" or "{{Name}}: Description"
  const variableDefMatches = analysis.matchAll(/(?:Variable|Var|\*\*|-)(?:\s+\d+)?(?:\s*\(([^)]+)\))?:?\s*(?:{{)?(\w+)(?:}})?(?:\s*[:=]\s*(.+?))?(?=\n|$)/g);
  
  for (const match of variableDefMatches) {
    const category = match[1] || getCategoryFromVariableName(match[2]);
    const name = match[2].trim();
    const value = match[3] ? match[3].trim() : "";
    
    // Skip category names and invalid variable names
    if (name === 'Task' || name === 'Persona' || name === 'Conditions' || name === 'Instructions' ||
        name.trim().length <= 1 || /^\*+$/.test(name) || /^[sS]$/.test(name)) {
      continue;
    }
    
    if (name && !variables.some((v: any) => v.name === name)) {
      variables.push({
        id: `v${variables.length + 1}`,
        name,
        value,
        isRelevant: true, // Mark as relevant by default
        category
      });
    }
  }
  
  // If we found some contextual variables in the analysis
  if (variables.length > 0) {
    return variables;
  }
  
  return generateContextualVariablesForPrompt(promptText);
}

/**
 * Extract variables directly from prompt text using {{variable}} syntax
 */
export function extractDirectVariablesFromPrompt(promptText: string): any[] {
  const variables = [];
  const variableRegex = /{{(\w+)}}/g;
  let match;
  
  while ((match = variableRegex.exec(promptText)) !== null) {
    const name = match[1];
    // Check if variable already exists, isn't a category name, and has a valid format
    if (name && 
        name.trim().length > 1 &&  // Must be more than a single character
        !/^\*+$/.test(name) &&     // Must not be just asterisks
        !/^[sS]$/.test(name) &&    // Must not be just 's'
        name !== 'Task' && 
        name !== 'Persona' && 
        name !== 'Conditions' && 
        name !== 'Instructions' && 
        !variables.some((v: any) => v.name === name)) {
      variables.push({
        id: `v${variables.length + 1}`,
        name,
        value: "",
        isRelevant: true, // Mark as relevant by default
        category: getCategoryFromVariableName(name)
      });
    }
  }
  
  return variables;
}

/**
 * Extract master command from AI analysis
 */
export function extractMasterCommand(analysis: string): string {
  // Look for explicit "Master Command" section
  const masterCommandMatch = analysis.match(/(?:Master Command|Command|Purpose)(?:\s*:|\n)\s*(.+?)(?=\n\n|\n#|$)/s);
  
  if (masterCommandMatch && masterCommandMatch[1]) {
    return masterCommandMatch[1].trim();
  }
  
  // Look for "Enhanced Prompt" title as a fallback
  const titleMatch = analysis.match(/# (.+?)(?=\n|$)/);
  if (titleMatch && titleMatch[1] && !titleMatch[1].toLowerCase().includes("enhanced prompt")) {
    return titleMatch[1].trim();
  }
  
  return "Create a well-structured prompt based on the input";
}

/**
 * Extract enhanced prompt from AI analysis
 */
export function extractEnhancedPrompt(analysis: string): string {
  // Look for a markdown code block
  const codeBlockMatch = analysis.match(/```(?:markdown|md)?\s*([\s\S]*?)```/);
  
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }
  
  // Look for a section labeled as "Enhanced Prompt"
  const enhancedPromptMatch = analysis.match(/(?:# Enhanced Prompt|## Enhanced Prompt)(?:\s*:|\n)([\s\S]*?)(?=\n# |\n## |$)/s);
  
  if (enhancedPromptMatch && enhancedPromptMatch[1]) {
    return enhancedPromptMatch[1].trim();
  }
  
  // If all else fails, just return sections after "Task", "Persona", etc.
  const structuredSections = analysis.match(/((?:# |## )(?:Task|Persona|Conditions|Instructions)(?:\s*:|\n)[\s\S]*?)(?=\n# |\n## |$)/g);
  
  if (structuredSections && structuredSections.length > 0) {
    return `# Enhanced Prompt Template\n\n${structuredSections.join('\n\n')}`;
  }
  
  return "# Enhanced Prompt\n\nYour enhanced prompt will appear here after answering the questions.";
}

