import { Variable } from "@/components/dashboard/types";

// Add the new function to convert placeholders to an editable format
export const convertPlaceholdersToEditableFormat = (
  prompt: string, 
  variables: Variable[]
): string => {
  if (!prompt) return "";

  let editablePrompt = prompt;

  // Replace variable placeholders with their actual values for editing
  variables.filter(v => v.isRelevant).forEach(variable => {
    const placeholder = `{{value::${variable.id}}}`; 
    const value = variable.value || "";

    // Use a regex with word boundaries to prevent partial matches
    const regex = new RegExp(`\\${placeholder}`, 'g');
    editablePrompt = editablePrompt.replace(regex, value);
  });

  return editablePrompt;
};

/**
 * Replaces a variable placeholder in the prompt with a new placeholder,
 * ensuring that the replacement is done correctly by escaping special
 * characters in the original text.
 */
export const replaceVariableInPrompt = (
  prompt: string,
  originalText: string,
  newPlaceholder: string,
  variableName: string
): string => {
  // Escape special characters in the original text for regex
  const escapedOriginalText = originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create a regex pattern that matches the escaped original text
  // and replace it with the new placeholder
  const regex = new RegExp(escapedOriginalText, 'g');
  return prompt.replace(regex, newPlaceholder);
};

/**
 * Escapes special characters in a string to be used in a regular expression
 */
export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Converts edited content back to the standardized placeholder format.
 * This function takes the edited HTML content and replaces the non-editable
 * variable spans with the standardized {{value::id}} placeholders.
 */
export const convertEditedContentToPlaceholders = (
  editedContent: string,
  variables: any[]
): string => {
  let processedContent = editedContent;

  // Iterate through each relevant variable and replace the span with the placeholder
  variables.filter(v => v.isRelevant).forEach(variable => {
    // Updated regex that uses lookahead assertions to match attributes regardless of order
    const nonEditableRegex = new RegExp(
      `<span(?=[^>]*\\bclass=['"]non-editable-variable['"])(?=[^>]*\\bdata-variable-id=["']${variable.id}["'])[^>]*>[^<]*</span>`,
      'gi'
    );

    // Convert back to the original format expected by the app
    processedContent = processedContent.replace(nonEditableRegex, toVariablePlaceholder(variable.id));
  });

  return processedContent;
};

/**
 * Converts placeholders to HTML spans for display.
 * This function takes the final prompt and replaces the {{value::id}} placeholders
 * with HTML spans that highlight the variable.
 */
export const convertPlaceholdersToSpans = (
  finalPrompt: string,
  variables: any[]
): string => {
  let processedPrompt = finalPrompt;

  // Replace {{value::id}} with HTML spans
  processedPrompt = processedPrompt.replace(
    /{{([^:}]*)::([\w-]+)}}/g,
    (match, value, variableId) => {
      const variable = variables.find(v => v.id === variableId);
      const displayValue = variable ? variable.value : value;
      return `<span data-variable-id="${variableId}" contenteditable="false" class="variable-highlight">${displayValue}</span>`;
    }
  );

  return processedPrompt;
};

/**
 * Strips HTML tags from a string safely
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  
  try {
    // Create a temporary element to safely strip HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  } catch (error) {
    // Fallback to regex-based stripping if DOM approach fails
    return html.replace(/<[^>]*>?/gm, '');
  }
};

/**
 * Generates a standardized variable placeholder string.
 */
export const toVariablePlaceholder = (variableId: string): string => {
  return `{{value::${variableId}}}`;
};

/**
 * Generates clean text for API calls by replacing variables with their values
 * and stripping all HTML tags
 */
export const generateCleanTextFromHtml = (html: string, variables: any[]): string => {
  try {
    // Create a temporary element to parse the HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Replace all variable spans with their text content
    const variableSpans = temp.querySelectorAll('[data-variable-id]');
    variableSpans.forEach(span => {
      const variableId = span.getAttribute('data-variable-id');
      const variable = variables.find(v => v.id === variableId);
      if (variable) {
        span.textContent = variable.value || '';
      }
    });
    
    // Get the text content (strips all HTML)
    let cleanText = temp.textContent || '';
    
    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText;
  } catch (error) {
    console.error("Error generating clean text from HTML:", error);
    return stripHtml(html);
  }
};

/**
 * Creates a clean, plain text version of the prompt with variables replaced by their values.
 * This is suitable for copying to clipboard without any HTML tags or variable placeholders.
 */
export const createPlainTextPrompt = (prompt: string, variables: any[]): string => {
  if (!prompt) return "";
  
  let plainText = prompt;
  
  // Replace all variable placeholders with their values
  variables.forEach(variable => {
    if (variable && variable.id) {
      const placeholder = `{{value::${variable.id}}}`;
      const value = variable.value || "";
      plainText = plainText.replace(new RegExp(escapeRegExp(placeholder), 'g'), value);
    }
  });
  
  // Remove any HTML tags that might be present
  return stripHtml(plainText);
};
