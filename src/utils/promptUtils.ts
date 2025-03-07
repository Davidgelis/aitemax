
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

// Advanced context-aware variable extraction function
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
  
  // Look for specific patterns that might indicate variables
  const patterns = [
    { regex: /(?:^|\s)(tone|voice)(?:\s+(?:is|should be|of))?(?:\s+['"a-zA-Z]+)?/i, name: "Tone" },
    { regex: /(?:^|\s)(audience|recipient)(?:\s+(?:is|are|includes))?(?:\s+['"a-zA-Z]+)?/i, name: "Audience" },
    { regex: /(?:^|\s)(format|style|type)(?:\s+(?:is|should be))?(?:\s+['"a-zA-Z]+)?/i, name: "Format" },
    { regex: /(?:^|\s)(length|word count)(?:\s+(?:is|should be|of))?(?:\s+\d+)?/i, name: "Length" },
    { regex: /(?:^|\s)(topic|subject)(?:\s+(?:is|about))?(?:\s+['"a-zA-Z]+)?/i, name: "Topic" }
  ];
  
  // Search for each pattern
  for (const pattern of patterns) {
    const patternMatch = text.match(pattern.regex);
    if (patternMatch && !variables.some(v => v.name === pattern.name)) {
      // Try to extract a default value if present
      let value = "";
      const valueMatch = text.match(new RegExp(`${pattern.regex.source}\\s+(['"a-zA-Z0-9]+)`, 'i'));
      if (valueMatch && valueMatch[2]) {
        value = valueMatch[2].replace(/['"]/g, '');
      }
      
      variables.push({
        name: pattern.name,
        value
      });
    }
  }
  
  return variables;
};
