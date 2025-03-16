
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

// Completely replace the selected text with a variable placeholder or value
export const replaceVariableInPrompt = (
  prompt: string, 
  selectedText: string, 
  newValue: string, 
  variableName: string
): string => {
  // If there's no selected text or prompt, return original prompt
  if (!prompt || !selectedText) return prompt;
  
  // If the selected text exists in the prompt, replace it completely
  if (prompt.includes(selectedText)) {
    return prompt.replace(selectedText, newValue);
  }
  
  // If we're replacing with a variable placeholder
  if (newValue.startsWith('{{') && newValue.endsWith('}}')) {
    // Create a regex that matches the text exactly
    const regex = new RegExp(escapeRegExp(selectedText), 'g');
    return prompt.replace(regex, newValue);
  }

  // Make sure we handle empty newValue correctly - if it's empty,
  // we still need to replace the selected text with the placeholder
  if (!newValue && variableName) {
    const placeholder = `{{${variableName}}}`;
    return prompt.replace(new RegExp(escapeRegExp(selectedText), 'g'), placeholder);
  }
  
  // Direct replacement for all occurrences
  try {
    return prompt.replace(new RegExp(escapeRegExp(selectedText), 'g'), newValue);
  } catch (error) {
    console.error("Error replacing variable in prompt:", error);
    return prompt;
  }
};

// Helper function to escape special regex characters
export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
