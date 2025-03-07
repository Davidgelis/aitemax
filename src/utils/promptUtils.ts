
export const extractVariablesFromPrompt = (prompt: string): string[] => {
  if (!prompt || typeof prompt !== 'string') return [];
  
  const pattern = /{{([^}]+)}}/g;
  const matches = prompt.match(pattern) || [];
  return matches.map(match => match.replace(/[{}]/g, '').trim());
};

export const findVariableOccurrences = (text: string, variableValue: string): number[] => {
  if (!text || !variableValue) return [];
  
  const positions: number[] = [];
  let position = text.indexOf(variableValue);
  
  while (position !== -1) {
    positions.push(position);
    position = text.indexOf(variableValue, position + 1);
  }
  
  return positions;
};

// Safely replace text in a string without affecting other occurrences
export const replaceVariableInPrompt = (
  prompt: string, 
  oldValue: string, 
  newValue: string, 
  variableName: string
): string => {
  // If both values are empty, return original prompt
  if (!oldValue && !newValue) return prompt;
  
  // If there's no old value, look for variable placeholder pattern
  if (!oldValue) {
    const pattern = new RegExp(`{{\\s*${variableName}\\s*}}`, 'g');
    return prompt.replace(pattern, newValue);
  }
  
  // If there's no new value, restore the placeholder
  if (!newValue) {
    // Create a regex that only matches the exact old value
    const pattern = new RegExp(`\\b${oldValue}\\b`, 'g');
    return prompt.replace(pattern, `{{${variableName}}}`);
  }
  
  // Handle normal replacement of old value with new value
  // Use word boundary to prevent partial replacements
  const pattern = new RegExp(`\\b${oldValue}\\b`, 'g');
  return prompt.replace(pattern, newValue);
};

// Function to check for variable placeholders in text
export const hasVariablePlaceholders = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  
  const pattern = /{{([^}]+)}}/g;
  return pattern.test(text);
};

// Function to convert all variables placeholders to their values
export const fillAllVariables = (prompt: string, variables: any[]): string => {
  if (!prompt || !Array.isArray(variables) || variables.length === 0) return prompt;
  
  let processedPrompt = prompt;
  
  variables.forEach(variable => {
    if (variable && variable.name && variable.value) {
      const pattern = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
      processedPrompt = processedPrompt.replace(pattern, variable.value);
    }
  });
  
  return processedPrompt;
};

// Get variable names from a string formatted with {{varName}}
export const getVariableNamesFromPrompt = (prompt: string): string[] => {
  if (!prompt || typeof prompt !== 'string') return [];
  
  const variableRegex = /{{(\w+)}}/g;
  const variableNames: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(prompt)) !== null) {
    if (match[1] && !variableNames.includes(match[1])) {
      variableNames.push(match[1]);
    }
  }
  
  return variableNames;
};

// Check if a specific variable is used in the prompt
export const isVariableUsedInPrompt = (prompt: string, variableName: string): boolean => {
  if (!prompt || typeof prompt !== 'string' || !variableName) return false;
  
  const pattern = new RegExp(`{{\\s*${variableName}\\s*}}`, 'g');
  return pattern.test(prompt);
};

// Advanced context-aware variable extraction function with improved detection
export const extractContextAwareVariables = (text: string): { name: string, value: string }[] => {
  if (!text || typeof text !== 'string') return [];
  
  const variables: { name: string, value: string }[] = [];
  
  // First extract any variables in {{brackets}}
  const bracketsRegex = /{{(\w+)}}/g;
  let match;
  
  while ((match = bracketsRegex.exec(text)) !== null) {
    if (match[1] && !variables.some(v => v.name === match[1])) {
      variables.push({
        name: match[1],
        value: ""
      });
    }
  }
  
  // Then look for key-value pairs in the format "key: value" or "key = value"
  const keyValueRegex = /(?:^|\n|\s)([a-zA-Z\s]+)(?:\:|=)\s*["']?([^"'\n,]+)["']?(?:[,\n]|$)/g;
  
  while ((match = keyValueRegex.exec(text)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();
    
    if (name && name.length > 1 && !variables.some(v => v.name === name)) {
      variables.push({
        name,
        value
      });
    }
  }
  
  // Enhanced analysis for common prompt patterns
  // Look for specific patterns that might indicate variables
  const enhancedPatterns = [
    // Content type patterns
    { regex: /(?:create|write|generate)\s+(?:a|an)\s+([a-zA-Z\s]+)/i, name: "ContentType" },
    { regex: /(?:design|develop|build)\s+(?:a|an)\s+([a-zA-Z\s]+)/i, name: "ProjectType" },
    
    // Subject matter patterns
    { regex: /(?:about|regarding|concerning|on)\s+([a-zA-Z\s]+)/i, name: "Subject" },
    { regex: /(?:for)\s+([a-zA-Z\s]+(?:\s+[a-zA-Z]+){0,3})/i, name: "Audience" },
    
    // Specific attributes patterns
    { regex: /(?:^|\s)(tone|voice)(?:\s+(?:is|should be|of))?(?:\s+([a-zA-Z]+))?/i, name: "Tone", valueGroup: 2 },
    { regex: /(?:^|\s)(audience|recipient|target)(?:\s+(?:is|are|includes))?(?:\s+([a-zA-Z\s]+))?/i, name: "Audience", valueGroup: 2 },
    { regex: /(?:^|\s)(format|style|type)(?:\s+(?:is|should be))?(?:\s+([a-zA-Z]+))?/i, name: "Format", valueGroup: 2 },
    { regex: /(?:^|\s)(length|word count)(?:\s+(?:is|should be|of))?(?:\s+(\d+))?/i, name: "Length", valueGroup: 2 },
    { regex: /(?:^|\s)(topic|subject)(?:\s+(?:is|about))?(?:\s+([a-zA-Z\s]+))?/i, name: "Topic", valueGroup: 2 },
    { regex: /(?:^|\s)(platform|channel|medium)(?:\s+(?:is|on))?(?:\s+([a-zA-Z]+))?/i, name: "Platform", valueGroup: 2 },
    { regex: /(?:^|\s)(language|locale)(?:\s+(?:is|in))?(?:\s+([a-zA-Z]+))?/i, name: "Language", valueGroup: 2 },
    { regex: /(?:^|\s)(industry|sector|field)(?:\s+(?:is|in))?(?:\s+([a-zA-Z\s]+))?/i, name: "Industry", valueGroup: 2 },
    { regex: /(?:^|\s)(brand|company|organization)(?:\s+(?:is|called))?(?:\s+([a-zA-Z\s]+))?/i, name: "Brand", valueGroup: 2 },
    { regex: /(?:^|\s)(product|service)(?:\s+(?:is|called))?(?:\s+([a-zA-Z\s]+))?/i, name: "Product", valueGroup: 2 },
    { regex: /(?:^|\s)(purpose|goal|objective)(?:\s+(?:is|to))?/i, name: "Purpose" },
    { regex: /(?:^|\s)(deadline|timeframe|due date)(?:\s+(?:is|by))?/i, name: "Deadline" },
    
    // Image-specific patterns (since your screenshot shows image-related variables)
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
    
    // Celebrity/person specific patterns (since your screenshot shows this type of variable)
    { regex: /Korean\s+(?:celebrity|actor|actress|idol|star)\s+([a-zA-Z\s]+)/i, name: "KoreanCelebrity" },
    { regex: /(?:celebrity|actor|actress|idol|star)\s+([a-zA-Z\s]+)/i, name: "Celebrity" },
    { regex: /(?:^|\s)(nationality|country|origin)(?:\s+(?:is|from))?(?:\s+([a-zA-Z\s]+))?/i, name: "Nationality", valueGroup: 2 }
  ];
  
  // Apply all the enhanced patterns to extract potential variables
  for (const pattern of enhancedPatterns) {
    const patternMatch = text.match(pattern.regex);
    if (patternMatch) {
      // Determine the value - either from a specified group or the first match
      let value = "";
      if (pattern.valueGroup && patternMatch[pattern.valueGroup]) {
        value = patternMatch[pattern.valueGroup].trim();
      } else if (patternMatch[1]) {
        value = patternMatch[1].trim();
      }
      
      // Skip if we already have this variable name
      if (!variables.some(v => v.name === pattern.name)) {
        variables.push({
          name: pattern.name,
          value: value
        });
      }
    }
  }
  
  // Optional: Analyze noun phrases for potential subjects
  // This is more advanced and might extract a lot of variables, so use with caution
  const words = text.split(/\s+/);
  const potentialSubjects = words.filter(word => 
    word.length > 3 && 
    word[0] === word[0].toUpperCase() && 
    !variables.some(v => v.name === word || v.value === word)
  );
  
  // Add unique potential subjects (limit to avoid too many)
  const uniqueSubjects = [...new Set(potentialSubjects)].slice(0, 3);
  uniqueSubjects.forEach(subject => {
    if (!variables.some(v => v.name === "Subject" + subject)) {
      variables.push({
        name: "Subject" + subject,
        value: subject
      });
    }
  });
  
  return variables;
};
