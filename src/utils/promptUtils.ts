
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

// Complete replacement function that doesn't rely on exact matching
export const replaceVariableInPrompt = (
  prompt: string, 
  oldValue: string, 
  newValue: string, 
  variableName: string
): string => {
  // If both values are empty, return original prompt
  if (!oldValue && !newValue) return prompt;
  
  // Direct replacement without pattern matching
  // This allows a complete replacement of text regardless of context
  if (oldValue && prompt.includes(oldValue)) {
    return prompt.replace(oldValue, newValue);
  }
  
  // If there's no old value, look for variable placeholder pattern
  if (!oldValue) {
    const pattern = new RegExp(`{{\\s*${variableName}\\s*}}`, 'g');
    return prompt.replace(pattern, newValue);
  }
  
  // If there's no new value, restore the placeholder
  if (!newValue) {
    return prompt.replace(oldValue, `{{${variableName}}}`);
  }
  
  // Fallback to direct string replacement
  try {
    return prompt.replace(oldValue, newValue);
  } catch (error) {
    console.error("Error replacing variable in prompt:", error);
    return prompt;
  }
};
