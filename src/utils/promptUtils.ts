
export const extractVariablesFromPrompt = (prompt: string): string[] => {
  const pattern = /{{([^}]+)}}/g;
  const matches = prompt.match(pattern) || [];
  return matches.map(match => match.replace(/[{}]/g, '').trim());
};

export const findVariableOccurrences = (text: string, variableValue: string): number[] => {
  const positions: number[] = [];
  let position = text.indexOf(variableValue);
  
  if (!variableValue || variableValue.trim() === '') {
    return positions;
  }
  
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

export const extractImageDetailsFromAnalysis = (analysisText: string): Record<string, string> => {
  const details: Record<string, string> = {};
  
  // Common image descriptors we want to extract
  const descriptors = [
    'subject', 'viewpoint', 'perspective', 'setting', 'location',
    'time of day', 'season', 'weather', 'lighting', 'color palette',
    'mood', 'atmosphere', 'composition', 'style', 'texture'
  ];
  
  // Look for sections that might contain image descriptions
  const imageSections = [
    // Look for a dedicated image description section
    analysisText.match(/image description:?([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i),
    // Look for visual analysis section
    analysisText.match(/visual analysis:?([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i),
    // Look for image analysis section
    analysisText.match(/image analysis:?([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i),
    // Just use the full text as a fallback
    [null, analysisText]
  ].filter(match => match && match[1])[0];
  
  if (!imageSections || !imageSections[1]) {
    return details;
  }
  
  const imageText = imageSections[1];
  
  // Extract each descriptor with its value
  descriptors.forEach(descriptor => {
    // Handle different formats of image descriptions
    const patterns = [
      // Format: "Descriptor: value" or "Descriptor - value"
      new RegExp(`${descriptor}:?\\s*-?\\s*([^\\n.]+)[\\n.]`, 'i'),
      // Format: "The descriptor is value" or "descriptor appears to be value"
      new RegExp(`${descriptor}(?:\\s+is|\\s+appears\\s+to\\s+be)\\s+([^\\n.]+)[\\n.]`, 'i'),
      // For more complex multi-line descriptions
      new RegExp(`${descriptor}:?\\s*-?\\s*([^\\n]+(?:\\n\\s+[^\\n]+)*)(?=\\n\\n|\\n[A-Z]|$)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = imageText.match(pattern);
      if (match && match[1]) {
        details[descriptor.toLowerCase().replace(/\s+/g, '')] = match[1].trim();
        break;
      }
    }
  });
  
  return details;
};
