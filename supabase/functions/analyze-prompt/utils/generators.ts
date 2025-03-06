
// Helper functions to generate fallback data

/**
 * Generate context-appropriate questions based on prompt text
 */
export function generateContextQuestionsForPrompt(promptText: string): any[] {
  const lowerPrompt = promptText.toLowerCase();
  
  // For Google Sheets / spreadsheet scripts
  if (lowerPrompt.includes('google sheet') || lowerPrompt.includes('spreadsheet') || lowerPrompt.includes('excel')) {
    return [
      { id: "q1", text: "How many rows of data will typically be processed?", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Is this script meant to run automatically or manually?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q3", text: "Will non-technical users need to modify the script later?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q4", text: "Are there any performance concerns with large datasets?", isRelevant: null, answer: "", category: "Instructions" },
    ];
  }
  
  // For email-related prompts
  if (lowerPrompt.includes('email') || lowerPrompt.includes('message') || lowerPrompt.includes('communication')) {
    return [
      { id: "q1", text: "What is the ongoing relationship with the recipient?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q2", text: "Is this a one-time message or part of a series?", isRelevant: null, answer: "", category: "Task" },
      { id: "q3", text: "Are there any sensitive topics to approach carefully?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "What's the expected response you're hoping to receive?", isRelevant: null, answer: "", category: "Instructions" },
    ];
  }
  
  // For coding/programming tasks
  if (lowerPrompt.includes('code') || lowerPrompt.includes('script') || lowerPrompt.includes('program') || lowerPrompt.includes('function')) {
    return [
      { id: "q1", text: "What is the expected execution environment?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q2", text: "Are there any specific libraries or dependencies to use or avoid?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q3", text: "What scale of data will this solution need to handle?", isRelevant: null, answer: "", category: "Task" },
      { id: "q4", text: "Who will maintain this code in the future?", isRelevant: null, answer: "", category: "Persona" },
    ];
  }
  
  // Default to general context questions
  return [
    { id: "q1", text: "What specific outcome or result are you looking to achieve?", isRelevant: null, answer: "", category: "Task" },
    { id: "q2", text: "Who is the intended audience for this output?", isRelevant: null, answer: "", category: "Persona" },
    { id: "q3", text: "Are there any time constraints or deadlines?", isRelevant: null, answer: "", category: "Conditions" },
    { id: "q4", text: "What format or structure is most important for the output?", isRelevant: null, answer: "", category: "Instructions" }
  ];
}

/**
 * Generate context-appropriate variables based on prompt text
 */
export function generateContextualVariablesForPrompt(promptText: string): any[] {
  const promptContext = promptText.toLowerCase();
  
  // For Google Sheets related prompts
  if (promptContext.includes('google sheet') || promptContext.includes('spreadsheet') || promptContext.includes('excel')) {
    return [
      { id: "v1", name: "HighlightColor", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "ResultsTabName", value: "", isRelevant: null, category: "Conditions" },
      { id: "v3", name: "SourceTabName", value: "", isRelevant: null, category: "Task" },
      { id: "v4", name: "SumFormula", value: "", isRelevant: null, category: "Instructions" }
    ];
  }
  
  // For email-related prompts
  if (promptContext.includes("email") || promptContext.includes("message")) {
    return [
      { id: "v1", name: "RecipientName", value: "", isRelevant: null, category: "Persona" },
      { id: "v2", name: "EmailSubject", value: "", isRelevant: null, category: "Task" },
      { id: "v3", name: "DesiredTone", value: "", isRelevant: null, category: "Persona" },
      { id: "v4", name: "ParagraphCount", value: "", isRelevant: null, category: "Conditions" },
      { id: "v5", name: "SignatureLine", value: "", isRelevant: null, category: "Instructions" }
    ];
  }
  
  // For content creation prompts
  if (promptContext.includes("content") || promptContext.includes("write") || promptContext.includes("article")) {
    return [
      { id: "v1", name: "TopicName", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "WordCount", value: "", isRelevant: null, category: "Conditions" },
      { id: "v3", name: "KeyPoints", value: "", isRelevant: null, category: "Instructions" },
      { id: "v4", name: "TargetAudience", value: "", isRelevant: null, category: "Persona" }
    ];
  }
  
  // For code-related prompts
  if (promptContext.includes("code") || promptContext.includes("programming") || promptContext.includes("develop")) {
    return [
      { id: "v1", name: "Language", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "FunctionName", value: "", isRelevant: null, category: "Instructions" },
      { id: "v3", name: "InputParameters", value: "", isRelevant: null, category: "Conditions" },
      { id: "v4", name: "ExpectedOutput", value: "", isRelevant: null, category: "Instructions" }
    ];
  }
  
  // Default variables
  return [
    { id: "v1", name: "TaskDescription", value: "", isRelevant: null, category: "Task" },
    { id: "v2", name: "RecipientName", value: "", isRelevant: null, category: "Persona" },
    { id: "v3", name: "WordCount", value: "", isRelevant: null, category: "Conditions" },
    { id: "v4", name: "FormatStyle", value: "", isRelevant: null, category: "Instructions" }
  ];
}
