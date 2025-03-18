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
  if (newValue.startsWith('<span') && newValue.includes('variable-placeholder')) {
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

// Enhanced helper to clean HTML from text (for variable removal)
export const stripHtml = (html: string): string => {
  if (!html) return "";
  
  try {
    // Try using DOMParser first (works in browsers)
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // Additional processing for variable spans
    const variableSpans = doc.querySelectorAll('[data-variable-id]');
    variableSpans.forEach(span => {
      // Replace span with its text content
      const textNode = doc.createTextNode(span.textContent || "");
      span.parentNode?.replaceChild(textNode, span);
    });
    
    return doc.body.textContent || "";
  } catch (error) {
    // Fallback - basic regex to strip HTML tags
    return html
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .replace(/&nbsp;/g, " ") // Replace HTML space entities
      .replace(/\s+/g, " ")    // Normalize whitespace
      .trim();                 // Trim leading/trailing whitespace
  }
};

// Generate clean text for API calls
export const generateCleanTextForApi = (
  processedHtml: string, 
  variables: any[]
): string => {
  try {
    const temp = document.createElement('div');
    temp.innerHTML = processedHtml;
    
    // Replace variable spans with their values
    const variableSpans = temp.querySelectorAll('[data-variable-id]');
    variableSpans.forEach(span => {
      const variableId = span.getAttribute('data-variable-id');
      const variable = variables.find(v => v.id === variableId);
      if (variable) {
        span.textContent = variable.value || '';
      }
    });
    
    // Extract text and normalize whitespace
    let cleanText = temp.textContent || '';
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText;
  } catch (error) {
    console.error("Error generating clean text for API:", error);
    return stripHtml(processedHtml);
  }
};

// Extract variable id from the special format we use for editing
export const extractVariableId = (text: string): string | null => {
  const match = text.match(/{{[^:}]*::([^}]+)}}/);
  return match ? match[1] : null;
};

// Convert a variable in the {{value::id}} format to a proper span
export const convertVariableToSpan = (text: string, variables: any[]): string => {
  return text.replace(/{{([^:}]*)::([\w-]+)}}/g, (_, value, id) => {
    const variable = variables.find(v => v.id === id);
    const displayValue = variable ? variable.value || "" : value;
    return `<span data-variable-id="${id}" contenteditable="false" class="variable-highlight">${displayValue}</span>`;
  });
};

// Standardized placeholder format for variables
export const toVariablePlaceholder = (variableId: string): string => {
  return `{{VAR:${variableId}}}`;
};

// Convert placeholder to editable format for edit mode
export const convertPlaceholdersToEditableFormat = (text: string, variables: any[]): string => {
  // Replace {{VAR:id}} format with editable format
  return text.replace(/{{VAR:([\w-]+)}}/g, (_, variableId) => {
    const variable = variables.find(v => v.id === variableId);
    const displayValue = variable?.value || "";
    return `{{${displayValue}::${variableId}}}`;
  });
};

// Convert the edited content back to placeholders format
export const convertEditedContentToPlaceholders = (
  content: string, 
  variables: any[]
): string => {
  let processedContent = content;
  
  // First, replace any {{value::id}} format with placeholders
  processedContent = processedContent.replace(
    /{{([^:}]*)::([\w-]+)}}/g, 
    (_, __, variableId) => toVariablePlaceholder(variableId)
  );
  
  // Then replace any non-editable spans with placeholders
  variables.forEach(variable => {
    if (!variable.id) return;
    
    const spanPattern = new RegExp(
      `<span[^>]*data-variable-id=["']${variable.id}["'][^>]*>.*?</span>`,
      'gi'
    );
    
    processedContent = processedContent.replace(
      spanPattern,
      toVariablePlaceholder(variable.id)
    );
  });
  
  return processedContent;
};

// Convert placeholders to HTML spans for display
export const convertPlaceholdersToSpans = (
  text: string, 
  variables: any[]
): string => {
  return text.replace(/{{VAR:([\w-]+)}}/g, (_, variableId) => {
    const variable = variables.find(v => v.id === variableId);
    if (!variable) return _;
    
    return `<span data-variable-id="${variableId}" contenteditable="false" class="variable-highlight">${variable.value || ""}</span>`;
  });
};
