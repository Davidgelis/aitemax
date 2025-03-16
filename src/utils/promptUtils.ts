
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
  try {
    const escapedOldValue = oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escapedOldValue}\\b`, 'g');
    return prompt.replace(pattern, newValue);
  } catch (error) {
    console.error("Error replacing variable in prompt:", error);
    // Fallback to direct string replacement if regex fails
    return prompt.split(oldValue).join(newValue);
  }
};
