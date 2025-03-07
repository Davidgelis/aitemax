
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
