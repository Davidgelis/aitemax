
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
  
  // If no questions found through regular means, try to generate context-aware questions
  if (questions.length === 0) {
    // Look for implied questions in the analysis
    const paragraphs = analysis.split('\n\n');
    
    for (const paragraph of paragraphs) {
      if (paragraph.toLowerCase().includes('clarify') || 
          paragraph.toLowerCase().includes('specify') ||
          paragraph.toLowerCase().includes('missing information')) {
        
        // Convert statements into questions
        const statements = paragraph.split('\n').filter(line => 
          line.trim().length > 10 && 
          !line.includes('===') && 
          !line.startsWith('#')
        );
        
        for (const statement of statements) {
          const cleanStatement = statement.replace(/^[-*•]\s*/, '').trim();
          if (cleanStatement) {
            // Convert statement to question if it's not already a question
            const question = cleanStatement.endsWith('?') ? 
              cleanStatement : 
              `What ${cleanStatement.toLowerCase().startsWith('what') ? cleanStatement.substring(4) : cleanStatement}?`;
            
            questions.push({
              id: `q${questions.length + 1}`,
              text: question,
              category: getCategoryFromText(question),
              isRelevant: null,
              answer: ""
            });
          }
        }
      }
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
  
  // Try to find a JSON block containing variables
  const jsonMatch = analysis.match(/```json\s*({[\s\S]*?})\s*```/);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsedJson = JSON.parse(jsonMatch[1]);
      if (parsedJson.variables && Array.isArray(parsedJson.variables)) {
        // Filter out any variables that match category names or have invalid names
        const aiVariables = parsedJson.variables
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
            category: v.category || getCategoryFromVariableName(v.name),
            code: v.code || `VAR_${i+1}`
          }));
          
        // Combine direct variables and AI-extracted variables to ensure we get the best of both
        if (directVariables.length > 0) {
          // Create a merged list without duplicates
          const mergedVariables = [...directVariables];
          
          for (const aiVar of aiVariables) {
            if (!mergedVariables.some(v => v.name.toLowerCase() === aiVar.name.toLowerCase())) {
              mergedVariables.push(aiVar);
            }
          }
          
          return mergedVariables.map((v, i) => ({
            ...v,
            code: v.code || `VAR_${i+1}`
          }));
        }
        
        return aiVariables;
      }
    } catch (e) {
      console.error("Error parsing JSON from analysis:", e);
    }
  }
  
  // Check for variable patterns like {{VariableName}}
  let enhancedPrompt = extractEnhancedPrompt(analysis);
  const contextualVariables = extractDirectVariablesFromPrompt(enhancedPrompt);
  
  // Combine with directly extracted variables from original prompt
  if (contextualVariables.length > 0 || directVariables.length > 0) {
    const combinedVariables = [...directVariables];
    
    // Add contextual variables that don't already exist
    for (const contextVar of contextualVariables) {
      if (!combinedVariables.some(v => v.name.toLowerCase() === contextVar.name.toLowerCase())) {
        combinedVariables.push(contextVar);
      }
    }
    
    if (combinedVariables.length > 0) {
      return combinedVariables.map((v, i) => ({
        ...v,
        code: v.code || `VAR_${i+1}`
      }));
    }
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
        category,
        code: `VAR_${variables.length + 1}`
      });
    }
  }
  
  // If we found some contextual variables in the analysis
  if (variables.length > 0) {
    // Combine with direct variables
    const combinedVars = [...directVariables];
    
    for (const analysisVar of variables) {
      if (!combinedVars.some(v => v.name.toLowerCase() === analysisVar.name.toLowerCase())) {
        combinedVars.push(analysisVar);
      }
    }
    
    return combinedVars.map((v, i) => ({
      ...v,
      code: v.code || `VAR_${i+1}`
    }));
  }
  
  // If we have direct variables from the prompt, use them
  if (directVariables.length > 0) {
    return directVariables.map((v, i) => ({
      ...v,
      code: v.code || `VAR_${i+1}`
    }));
  }
  
  // Extract potential variables from the prompt text even if not in {{brackets}}
  const impliedVars = extractImpliedVariablesFromPrompt(promptText);
  if (impliedVars.length > 0) {
    return impliedVars.map((v, i) => ({
      ...v,
      code: v.code || `VAR_${i+1}`
    }));
  }
  
  // Final fallback: Generate context-appropriate variables
  return generateContextualVariablesForPrompt(promptText).map((v, i) => ({
    ...v,
    code: v.code || `VAR_${i+1}`
  }));
}

/**
 * Extract variables directly from prompt text using {{variable}} syntax
 */
export function extractDirectVariablesFromPrompt(promptText: string): any[] {
  if (!promptText || typeof promptText !== 'string') {
    return [];
  }
  
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
        category: getCategoryFromVariableName(name),
        code: `VAR_${variables.length + 1}`
      });
    }
  }
  
  return variables;
}

/**
 * Extract implied variables from prompt text by looking for key terms
 */
export function extractImpliedVariablesFromPrompt(promptText: string): any[] {
  if (!promptText || typeof promptText !== 'string') {
    return [];
  }
  
  const variables = [];
  
  // First, extract any clearly defined key-value pairs in the text
  const keyValueRegex = /(?:^|\n|\s)([a-zA-Z\s]+)(?:\:|=)\s*["']?([^"'\n,]+)["']?(?:[,\n]|$)/g;
  let kvMatch;
  
  while ((kvMatch = keyValueRegex.exec(promptText)) !== null) {
    const name = kvMatch[1].trim();
    const value = kvMatch[2].trim();
    
    if (name && name.length > 1 && !variables.some(v => v.name === name)) {
      variables.push({
        id: `v${variables.length + 1}`,
        name: name,
        value: value,
        isRelevant: true,
        category: getCategoryFromVariableName(name),
        code: `VAR_${variables.length + 1}`
      });
    }
  }
  
  // Common variable patterns to look for
  const patterns = [
    { regex: /(?:^|\s)(tone|voice)(?:\s+(?:is|should be|of))?(?:\s+['"a-zA-Z]+)?/i, name: "Tone", category: "Persona" },
    { regex: /(?:^|\s)(audience|recipient|target)(?:\s+(?:is|are|includes))?(?:\s+['"a-zA-Z]+)?/i, name: "Audience", category: "Persona" },
    { regex: /(?:^|\s)(format|style|type)(?:\s+(?:is|should be))?(?:\s+['"a-zA-Z]+)?/i, name: "Format", category: "Instructions" },
    { regex: /(?:^|\s)(length|word count|character limit)(?:\s+(?:is|should be|of))?(?:\s+\d+)?/i, name: "Length", category: "Conditions" },
    { regex: /(?:^|\s)(topic|subject|theme)(?:\s+(?:is|about))?(?:\s+['"a-zA-Z]+)?/i, name: "Topic", category: "Task" },
    { regex: /(?:^|\s)(goal|objective|purpose)(?:\s+(?:is|to))?/i, name: "Goal", category: "Task" },
    { regex: /(?:^|\s)(deadline|timeframe|due date)(?:\s+(?:is|by))?/i, name: "Deadline", category: "Conditions" },
    { regex: /(?:^|\s)(language|dialect)(?:\s+(?:is|should be))?(?:\s+['"a-zA-Z]+)?/i, name: "Language", category: "Instructions" },
    { regex: /(?:^|\s)(image|picture|photo)(?:\s+(?:of|showing|depicting))?(?:\s+['"a-zA-Z]+)?/i, name: "Image", category: "Task" },
    { regex: /(?:^|\s)(color|background|palette)(?:\s+(?:is|should be))?(?:\s+['"a-zA-Z]+)?/i, name: "Color", category: "Instructions" },
    { regex: /(?:^|\s)(content|elements|components)(?:\s+(?:include|consist of|contain))?/i, name: "Content", category: "Task" },
    { regex: /(?:^|\s)(setting|location|place|scene)(?:\s+(?:is|in|at))?(?:\s+['"a-zA-Z]+)?/i, name: "Setting", category: "Task" },
    { regex: /(?:^|\s)(character|person|figure)(?:\s+(?:is|should be))?(?:\s+['"a-zA-Z]+)?/i, name: "Character", category: "Task" },
    { regex: /(?:^|\s)(celebrity|artist|actor|star)(?:\s+(?:is|should be|like))?(?:\s+['"a-zA-Z]+)?/i, name: "Celebrity", category: "Task" }
  ];
  
  // Search for each pattern
  for (const pattern of patterns) {
    const match = promptText.match(pattern.regex);
    if (match && !variables.some(v => v.name === pattern.name)) {
      // Try to extract a default value if present
      let value = "";
      
      // For example, if we find "tone should be professional", extract "professional"
      const valueMatch = promptText.match(new RegExp(`${pattern.regex.source}\\s+(['"a-zA-Z0-9]+)`, 'i'));
      if (valueMatch && valueMatch[2]) {
        value = valueMatch[2].replace(/['"]/g, '');
      }
      
      variables.push({
        id: `v${variables.length + 1}`,
        name: pattern.name,
        value,
        isRelevant: true,
        category: pattern.category,
        code: `VAR_${variables.length + 1}`
      });
    }
  }
  
  // Analyze prompt structure - look for specific keywords that indicate variables
  const lines = promptText.split(/[.,;\n]/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip short or empty lines
    if (trimmedLine.length < 5) continue;
    
    // Look for noun phrases that might be variables
    const nounPhraseMatches = trimmedLine.match(/\b([A-Z][a-z]+(?:\s+[a-z]+){0,2})\b/g);
    if (nounPhraseMatches) {
      for (const phrase of nounPhraseMatches) {
        if (phrase.length > 3 && 
            !variables.some(v => v.name === phrase) &&
            !['Task', 'Persona', 'Conditions', 'Instructions'].includes(phrase)) {
          variables.push({
            id: `v${variables.length + 1}`,
            name: phrase,
            value: "",
            isRelevant: true,
            category: getCategoryFromVariableName(phrase),
            code: `VAR_${variables.length + 1}`
          });
        }
      }
    }
  }
  
  return variables.length > 0 ? variables : generateContextualVariablesForPrompt(promptText);
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

// Import these at the end to avoid circular dependencies
import { generateContextQuestionsForPrompt, generateContextualVariablesForPrompt } from "./generators.ts";
