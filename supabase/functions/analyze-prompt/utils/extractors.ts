
/**
 * Utility functions for extracting components from AI analysis results
 */

// Extract questions from the AI analysis result
export const extractQuestions = (content: string) => {
  try {
    const parsedContent = JSON.parse(content);
    return parsedContent.questions || [];
  } catch (error) {
    console.error("Failed to extract questions:", error);
    return [];
  }
};

// Extract variables from the AI analysis result with enhanced classification
export const extractVariables = (content: string) => {
  try {
    const parsedContent = JSON.parse(content);
    return parsedContent.variables || [];
  } catch (error) {
    console.error("Failed to extract variables:", error);
    return [];
  }
};

// Extract the master command from the AI analysis result
export const extractMasterCommand = (content: string) => {
  try {
    const parsedContent = JSON.parse(content);
    return parsedContent.masterCommand || "";
  } catch (error) {
    console.error("Failed to extract master command:", error);
    return "";
  }
};

// Extract the enhanced prompt from the AI analysis result
export const extractEnhancedPrompt = (content: string) => {
  try {
    const parsedContent = JSON.parse(content);
    return parsedContent.enhancedPrompt || "";
  } catch (error) {
    console.error("Failed to extract enhanced prompt:", error);
    return "";
  }
};

// New helper: Classify if a gap should be a variable or question based on expected answer length
export const classifyGapType = (text: string, category: string): 'variable' | 'question' => {
  // Short-form answers that should be variables (1-3 words typically)
  const variablePatterns = [
    /color/i, /size/i, /dimension/i, /breed/i, /height/i, /width/i,
    /name/i, /number/i, /quantity/i, /age/i, /price/i, /cost/i,
    /type/i, /model/i, /brand/i, /date/i, /time/i, /duration/i,
    /range/i, /material/i, /weight/i, /length/i, /depth/i, /texture/i
  ];
  
  // Check if the text includes patterns that suggest a short-form answer
  const isLikelyVariable = variablePatterns.some(pattern => pattern.test(text)) && text.length < 100;
  
  // Style-related attributes are usually variables
  if (category === 'Style' || category === 'Technical') {
    return isLikelyVariable ? 'variable' : 'question';
  }
  
  // For other categories, prefer longer-form answers as questions
  return isLikelyVariable ? 'variable' : 'question';
};
