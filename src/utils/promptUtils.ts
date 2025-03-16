
export const extractVariablesFromPrompt = (prompt: string): string[] => {
  const pattern = /{{([^}]+)}}/g;
  const matches = prompt.match(pattern) || [];
  return matches.map(match => match.replace(/[{}]/g, '').trim());
};

export const findVariableOccurrences = (text: string, variableValue: string): number[] => {
  if (!variableValue || variableValue.trim() === "") return [];
  
  const positions: number[] = [];
  let position = text.indexOf(variableValue);
  
  while (position !== -1) {
    positions.push(position);
    position = text.indexOf(variableValue, position + 1);
  }
  
  return positions;
};

// Improved variable replacement function that doesn't rely on exact matching
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
    return prompt.replace(oldValue, `{{${variableName}}}`);
  }
  
  // Direct replacement of old value with new value without word boundaries
  // This allows replacement of any text, not just exact word matches
  try {
    return prompt.replace(oldValue, newValue);
  } catch (error) {
    console.error("Error replacing variable in prompt:", error);
    return prompt;
  }
};
