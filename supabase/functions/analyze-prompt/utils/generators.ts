
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
      { id: "q5", text: "What specific operations need to be performed on the data?", isRelevant: null, answer: "", category: "Task" },
      { id: "q6", text: "Are there any required data validation rules?", isRelevant: null, answer: "", category: "Conditions" },
    ];
  }
  
  // For email-related prompts
  if (lowerPrompt.includes('email') || lowerPrompt.includes('message') || lowerPrompt.includes('communication')) {
    return [
      { id: "q1", text: "What is the ongoing relationship with the recipient?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q2", text: "Is this a one-time message or part of a series?", isRelevant: null, answer: "", category: "Task" },
      { id: "q3", text: "Are there any sensitive topics to approach carefully?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "What's the expected response you're hoping to receive?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q5", text: "What tone would be most appropriate for this communication?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q6", text: "Are there specific action items the recipient should take?", isRelevant: null, answer: "", category: "Instructions" },
    ];
  }
  
  // For coding/programming tasks
  if (lowerPrompt.includes('code') || lowerPrompt.includes('script') || lowerPrompt.includes('program') || lowerPrompt.includes('function')) {
    return [
      { id: "q1", text: "What is the expected execution environment?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q2", text: "Are there any specific libraries or dependencies to use or avoid?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q3", text: "What scale of data will this solution need to handle?", isRelevant: null, answer: "", category: "Task" },
      { id: "q4", text: "Who will maintain this code in the future?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q5", text: "What are the performance requirements or constraints?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q6", text: "What error handling approach is appropriate?", isRelevant: null, answer: "", category: "Instructions" },
    ];
  }
  
  // For creative writing
  if (lowerPrompt.includes('write') || lowerPrompt.includes('story') || lowerPrompt.includes('article') || lowerPrompt.includes('blog')) {
    return [
      { id: "q1", text: "What is the primary theme or message to convey?", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Who is the target audience for this content?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q3", text: "What tone or style should the writing have?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q4", text: "Are there any word count limitations?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q5", text: "Should any specific keywords or phrases be included?", isRelevant: null, answer: "", category: "Task" },
      { id: "q6", text: "What type of emotional response should this evoke?", isRelevant: null, answer: "", category: "Persona" },
    ];
  }
  
  // For data analysis or reporting
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('report') || lowerPrompt.includes('data') || lowerPrompt.includes('statistics')) {
    return [
      { id: "q1", text: "What specific insights are you looking to extract from the data?", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Who will be reviewing this analysis?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q3", text: "What time period should the analysis cover?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "What visualization formats would be most useful?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q5", text: "Are there specific metrics that must be included?", isRelevant: null, answer: "", category: "Task" },
      { id: "q6", text: "What level of technical detail is appropriate?", isRelevant: null, answer: "", category: "Persona" },
    ];
  }
  
  // Default to general context questions
  return [
    { id: "q1", text: "What specific outcome or result are you looking to achieve?", isRelevant: null, answer: "", category: "Task" },
    { id: "q2", text: "Who is the intended audience for this output?", isRelevant: null, answer: "", category: "Persona" },
    { id: "q3", text: "Are there any time constraints or deadlines?", isRelevant: null, answer: "", category: "Conditions" },
    { id: "q4", text: "What format or structure is most important for the output?", isRelevant: null, answer: "", category: "Instructions" },
    { id: "q5", text: "What is the primary purpose of this content?", isRelevant: null, answer: "", category: "Task" },
    { id: "q6", text: "Are there any specific requirements that must be met?", isRelevant: null, answer: "", category: "Conditions" },
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
      { id: "v4", name: "SumFormula", value: "", isRelevant: null, category: "Instructions" },
      { id: "v5", name: "HeaderFormat", value: "", isRelevant: null, category: "Instructions" },
      { id: "v6", name: "DataRangeSize", value: "", isRelevant: null, category: "Conditions" },
      { id: "v7", name: "RunFrequency", value: "", isRelevant: null, category: "Conditions" },
    ];
  }
  
  // For email-related prompts
  if (promptContext.includes("email") || promptContext.includes("message")) {
    return [
      { id: "v1", name: "RecipientName", value: "", isRelevant: null, category: "Persona" },
      { id: "v2", name: "EmailSubject", value: "", isRelevant: null, category: "Task" },
      { id: "v3", name: "DesiredTone", value: "", isRelevant: null, category: "Persona" },
      { id: "v4", name: "ParagraphCount", value: "", isRelevant: null, category: "Conditions" },
      { id: "v5", name: "SignatureLine", value: "", isRelevant: null, category: "Instructions" },
      { id: "v6", name: "CallToAction", value: "", isRelevant: null, category: "Instructions" },
      { id: "v7", name: "ResponseDeadline", value: "", isRelevant: null, category: "Conditions" },
      { id: "v8", name: "RelationshipContext", value: "", isRelevant: null, category: "Persona" },
    ];
  }
  
  // For content creation prompts
  if (promptContext.includes("content") || promptContext.includes("write") || promptContext.includes("article")) {
    return [
      { id: "v1", name: "TopicName", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "WordCount", value: "", isRelevant: null, category: "Conditions" },
      { id: "v3", name: "KeyPoints", value: "", isRelevant: null, category: "Instructions" },
      { id: "v4", name: "TargetAudience", value: "", isRelevant: null, category: "Persona" },
      { id: "v5", name: "ContentTone", value: "", isRelevant: null, category: "Persona" },
      { id: "v6", name: "SEOKeywords", value: "", isRelevant: null, category: "Task" },
      { id: "v7", name: "HeadingStyle", value: "", isRelevant: null, category: "Instructions" },
      { id: "v8", name: "CallToAction", value: "", isRelevant: null, category: "Instructions" },
    ];
  }
  
  // For code-related prompts
  if (promptContext.includes("code") || promptContext.includes("programming") || promptContext.includes("develop")) {
    return [
      { id: "v1", name: "Language", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "FunctionName", value: "", isRelevant: null, category: "Instructions" },
      { id: "v3", name: "InputParameters", value: "", isRelevant: null, category: "Conditions" },
      { id: "v4", name: "ExpectedOutput", value: "", isRelevant: null, category: "Instructions" },
      { id: "v5", name: "ErrorHandling", value: "", isRelevant: null, category: "Conditions" },
      { id: "v6", name: "PerformanceRequirements", value: "", isRelevant: null, category: "Conditions" },
      { id: "v7", name: "CodeStyle", value: "", isRelevant: null, category: "Instructions" },
      { id: "v8", name: "Dependencies", value: "", isRelevant: null, category: "Task" },
    ];
  }
  
  // For data analysis prompts
  if (promptContext.includes("data") || promptContext.includes("analyze") || promptContext.includes("report")) {
    return [
      { id: "v1", name: "DataSource", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "TimeFrame", value: "", isRelevant: null, category: "Conditions" },
      { id: "v3", name: "KeyMetrics", value: "", isRelevant: null, category: "Task" },
      { id: "v4", name: "VisualizationType", value: "", isRelevant: null, category: "Instructions" },
      { id: "v5", name: "AudienceTechnicalLevel", value: "", isRelevant: null, category: "Persona" },
      { id: "v6", name: "ComparisonBenchmark", value: "", isRelevant: null, category: "Conditions" },
      { id: "v7", name: "ReportFormat", value: "", isRelevant: null, category: "Instructions" },
      { id: "v8", name: "InsightPriority", value: "", isRelevant: null, category: "Task" },
    ];
  }
  
  // Default variables
  return [
    { id: "v1", name: "TaskDescription", value: "", isRelevant: null, category: "Task" },
    { id: "v2", name: "RecipientName", value: "", isRelevant: null, category: "Persona" },
    { id: "v3", name: "WordCount", value: "", isRelevant: null, category: "Conditions" },
    { id: "v4", name: "FormatStyle", value: "", isRelevant: null, category: "Instructions" },
    { id: "v5", name: "ContentPurpose", value: "", isRelevant: null, category: "Task" },
    { id: "v6", name: "TargetAudience", value: "", isRelevant: null, category: "Persona" },
    { id: "v7", name: "Deadline", value: "", isRelevant: null, category: "Conditions" },
    { id: "v8", name: "ToneOfVoice", value: "", isRelevant: null, category: "Persona" },
  ];
}
