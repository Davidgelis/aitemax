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
  
  // Get context-aware variables from the prompt text
  const contextAwareVars = extractImpliedVariablesFromPrompt(promptText);
  
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
          
        // Combine direct variables, context-aware, and AI-extracted variables
        // to ensure we get the best variables from all sources
        const combinedVariables = [...directVariables, ...contextAwareVars];
        
        for (const aiVar of aiVariables) {
          if (!combinedVariables.some(v => v.name.toLowerCase() === aiVar.name.toLowerCase())) {
            combinedVariables.push(aiVar);
          }
        }
        
        return combinedVariables.map((v, i) => ({
          ...v,
          code: v.code || `VAR_${i+1}`,
          id: v.id || `v${i+1}`
        }));
      }
    } catch (e) {
      console.error("Error parsing JSON from analysis:", e);
    }
  }
  
  // Check for variable patterns like {{VariableName}} in enhanced prompt
  let enhancedPrompt = extractEnhancedPrompt(analysis);
  const contextualVariables = extractDirectVariablesFromPrompt(enhancedPrompt);
  
  // Combine all variables from different sources
  const allVariables = [...directVariables, ...contextAwareVars, ...contextualVariables];
  
  // Remove duplicates by name (case insensitive)
  const uniqueVariables: any[] = [];
  allVariables.forEach(variable => {
    if (!uniqueVariables.some(v => v.name.toLowerCase() === variable.name.toLowerCase())) {
      uniqueVariables.push(variable);
    }
  });
  
  if (uniqueVariables.length > 0) {
    return uniqueVariables.map((v, i) => ({
      ...v,
      id: v.id || `v${i+1}`,
      code: v.code || `VAR_${i+1}`,
      category: v.category || getCategoryFromVariableName(v.name),
      isRelevant: v.isRelevant !== undefined ? v.isRelevant : true
    }));
  }
  
  // Fallback: Look for variable definitions in analysis text
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
    // Combine all sources of variables
    const combinedVars = [...directVariables, ...contextAwareVars];
    
    for (const analysisVar of variables) {
      if (!combinedVars.some(v => v.name.toLowerCase() === analysisVar.name.toLowerCase())) {
        combinedVars.push(analysisVar);
      }
    }
    
    if (combinedVars.length > 0) {
      return combinedVars.map((v, i) => ({
        ...v,
        id: v.id || `v${i+1}`,
        code: v.code || `VAR_${i+1}`
      }));
    }
  }
  
  // If we still have no variables, try contextual extraction as a last resort
  if (allVariables.length === 0) {
    return extractImpliedVariablesFromPrompt(promptText).map((v, i) => ({
      ...v,
      id: v.id || `v${i+1}`,
      code: v.code || `VAR_${i+1}`
    }));
  }
  
  return allVariables.map((v, i) => ({
    ...v,
    id: v.id || `v${i+1}`,
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
 * Enhanced function to extract implied variables from prompt text by looking for key terms and patterns
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
  
  // Enhanced patterns with more context-specific and domain-specific patterns
  const enhancedPatterns = [
    // Content type patterns
    { regex: /(?:create|write|generate)\s+(?:a|an)\s+([a-zA-Z\s]+)/i, name: "ContentType" },
    { regex: /(?:design|develop|build)\s+(?:a|an)\s+([a-zA-Z\s]+)/i, name: "ProjectType" },
    
    // Subject matter patterns
    { regex: /(?:about|regarding|concerning|on)\s+([a-zA-Z\s]+)/i, name: "Subject" },
    { regex: /(?:for)\s+([a-zA-Z\s]+(?:\s+[a-zA-Z]+){0,3})/i, name: "Audience" },
    
    // Basic patterns (originally from promptUtils.ts)
    { regex: /(?:^|\s)(tone|voice)(?:\s+(?:is|should be|of))?(?:\s+([a-zA-Z]+))?/i, name: "Tone", valueGroup: 2 },
    { regex: /(?:^|\s)(audience|recipient|target)(?:\s+(?:is|are|includes))?(?:\s+([a-zA-Z\s]+))?/i, name: "Audience", valueGroup: 2 },
    { regex: /(?:^|\s)(format|style|type)(?:\s+(?:is|should be))?(?:\s+([a-zA-Z]+))?/i, name: "Format", valueGroup: 2 },
    { regex: /(?:^|\s)(length|word count)(?:\s+(?:is|should be|of))?(?:\s+(\d+))?/i, name: "Length", valueGroup: 2 },
    { regex: /(?:^|\s)(topic|subject)(?:\s+(?:is|about))?(?:\s+([a-zA-Z\s]+))?/i, name: "Topic", valueGroup: 2 },
    { regex: /(?:^|\s)(platform|channel|medium)(?:\s+(?:is|on))?(?:\s+([a-zA-Z]+))?/i, name: "Platform", valueGroup: 2 },
    { regex: /(?:^|\s)(language|dialect)(?:\s+(?:is|in))?(?:\s+([a-zA-Z]+))?/i, name: "Language", valueGroup: 2 },
    { regex: /(?:^|\s)(industry|sector|field)(?:\s+(?:is|in))?(?:\s+([a-zA-Z\s]+))?/i, name: "Industry", valueGroup: 2 },
    { regex: /(?:^|\s)(brand|company|organization)(?:\s+(?:is|called))?(?:\s+([a-zA-Z\s]+))?/i, name: "Brand", valueGroup: 2 },
    { regex: /(?:^|\s)(product|service)(?:\s+(?:is|called))?(?:\s+([a-zA-Z\s]+))?/i, name: "Product", valueGroup: 2 },
    { regex: /(?:^|\s)(purpose|goal|objective)(?:\s+(?:is|to))?/i, name: "Purpose" },
    { regex: /(?:^|\s)(deadline|timeframe|due date)(?:\s+(?:is|by))?/i, name: "Deadline" },
    
    // Image-specific patterns (since this might be about image prompts)
    { regex: /(?:image|picture|photo|illustration)\s+of\s+([a-zA-Z\s]+)/i, name: "ImageSubject" },
    { regex: /(?:^|\s)(background|setting|scene)(?:\s+(?:is|in|at|with))?(?:\s+([a-zA-Z\s]+))?/i, name: "Background", valueGroup: 2 },
    { regex: /(?:^|\s)(style|artistic style|art style)(?:\s+(?:is|should be|like))?(?:\s+([a-zA-Z\s]+))?/i, name: "ArtStyle", valueGroup: 2 },
    { regex: /(?:^|\s)(color scheme|palette|colors)(?:\s+(?:is|with|using))?(?:\s+([a-zA-Z\s,]+))?/i, name: "ColorScheme", valueGroup: 2 },
    { regex: /(?:^|\s)(mood|atmosphere|feeling)(?:\s+(?:is|should be))?(?:\s+([a-zA-Z\s]+))?/i, name: "Mood", valueGroup: 2 },
    { regex: /(?:^|\s)(character|person|figure|celebrity)(?:\s+(?:is|should be|like))?(?:\s+([a-zA-Z\s]+))?/i, name: "Character", valueGroup: 2 },
    { regex: /(?:^|\s)(composition|layout|arrangement)(?:\s+(?:is|should be|with))?(?:\s+([a-zA-Z\s]+))?/i, name: "Composition", valueGroup: 2 },
    { regex: /(?:^|\s)(lighting|light source|illumination)(?:\s+(?:is|should be|with))?(?:\s+([a-zA-Z\s]+))?/i, name: "Lighting", valueGroup: 2 },
    { regex: /(?:^|\s)(technique|method|approach)(?:\s+(?:is|should be|using))?(?:\s+([a-zA-Z\s]+))?/i, name: "Technique", valueGroup: 2 },
    { regex: /(?:^|\s)(perspective|viewpoint|angle)(?:\s+(?:is|should be|from))?(?:\s+([a-zA-Z\s]+))?/i, name: "Perspective", valueGroup: 2 },
    { regex: /(?:^|\s)(era|time period|century)(?:\s+(?:is|should be|from))?(?:\s+([a-zA-Z0-9\s]+))?/i, name: "TimePeriod", valueGroup: 2 },
    { regex: /(?:^|\s)(cultural reference|influence)(?:\s+(?:is|should be|from))?(?:\s+([a-zA-Z\s]+))?/i, name: "CulturalReference", valueGroup: 2 },
    
    // Celebrity/person specific patterns
    { regex: /Korean\s+(?:celebrity|actor|actress|idol|star)\s+([a-zA-Z\s]+)/i, name: "KoreanCelebrity" },
    { regex: /(?:celebrity|actor|actress|idol|star)\s+([a-zA-Z\s]+)/i, name: "Celebrity" },
    { regex: /(?:^|\s)(nationality|country|origin)(?:\s+(?:is|from))?(?:\s+([a-zA-Z\s]+))?/i, name: "Nationality", valueGroup: 2 }
  ];
  
  // Apply all the enhanced patterns to extract potential variables
  for (const pattern of enhancedPatterns) {
    const patternMatch = promptText.match(pattern.regex);
    if (patternMatch) {
      // Determine the value - either from a specified group or the first match
      let value = "";
      if (pattern.valueGroup && patternMatch[pattern.valueGroup]) {
        value = patternMatch[pattern.valueGroup].trim();
      } else if (patternMatch[1]) {
        value = patternMatch[1].trim();
      }
      
      // Skip if we already have this variable name
      if (!variables.some(v => v.name === pattern.name) && pattern.name) {
        variables.push({
          id: `v${variables.length + 1}`,
          name: pattern.name,
          value: value,
          isRelevant: true,
          category: getCategoryFromVariableName(pattern.name),
          code: `VAR_${variables.length + 1}`
        });
      }
    }
  }
  
  // Process common prompt structures - capture main intent
  const firstSentence = promptText.split(/[.!?]/, 1)[0].trim();
  if (firstSentence && firstSentence.length > 5 && firstSentence.length < 50) {
    const intentWords = ["create", "generate", "write", "design", "make", "develop", "build", "produce"];
    
    for (const word of intentWords) {
      if (firstSentence.toLowerCase().includes(word) && !variables.some(v => v.name === "Intent")) {
        variables.push({
          id: `v${variables.length + 1}`,
          name: "Intent",
          value: firstSentence,
          isRelevant: true,
          category: "Task",
          code: `VAR_${variables.length + 1}`
        });
        break;
      }
    }
  }
  
  // If no variables found, try to detect important words/phrases
  if (variables.length === 0) {
    const words = promptText.split(/\s+/);
    
    // Find words that start with capital letters (potential entities)
    const capitalWords = words.filter(word => 
      word.length > 3 && 
      word[0] === word[0].toUpperCase() &&
      !/^(The|And|But|Or|If|When|What|How|Why|Who|Where)$/i.test(word)
    );
    
    // Add unique capital words (potential entities) as variables
    const uniqueCapitalWords = [...new Set(capitalWords)].slice(0, 3);
    uniqueCapitalWords.forEach((word, index) => {
      variables.push({
        id: `v${variables.length + 1}`,
        name: `Entity${index + 1}`,
        value: word,
        isRelevant: true,
        category: "Task",
        code: `VAR_${variables.length + 1}`
      });
    });
  }
  
  // Final fallback: If we still have no variables extracted
  if (variables.length === 0) {
    return generateContextualVariablesForPrompt(promptText);
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

// Import these at the end to avoid circular dependencies
import { generateContextQuestionsForPrompt, generateContextualVariablesForPrompt } from "./generators.ts";
