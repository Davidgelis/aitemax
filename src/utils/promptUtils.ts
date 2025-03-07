
export const extractVariablesFromPrompt = (prompt: string): string[] => {
  const pattern = /{{([^}]+)}}/g;
  const matches = prompt.match(pattern) || [];
  return matches.map(match => match.replace(/[{}]/g, '').trim());
};

export const findVariableOccurrences = (text: string, variableValue: string): number[] => {
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
  const pattern = /{{([^}]+)}}/g;
  return pattern.test(text);
};

// Function to convert all variables placeholders to their values
export const fillAllVariables = (prompt: string, variables: any[]): string => {
  if (!Array.isArray(variables) || variables.length === 0) return prompt;
  
  let processedPrompt = prompt;
  
  variables.forEach(variable => {
    if (variable && variable.name && variable.value) {
      const pattern = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
      processedPrompt = processedPrompt.replace(pattern, variable.value);
    }
  });
  
  return processedPrompt;
};

