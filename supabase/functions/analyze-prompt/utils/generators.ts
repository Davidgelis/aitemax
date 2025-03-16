
// Helper functions to generate fallback data

/**
 * Generate context-appropriate questions based on prompt text
 */
export function generateContextQuestionsForPrompt(promptText: string): any[] {
  const lowerPrompt = promptText.toLowerCase();
  
  // For Google Sheets / spreadsheet scripts
  if (lowerPrompt.includes('google sheet') || lowerPrompt.includes('spreadsheet') || lowerPrompt.includes('excel')) {
    return [
      { id: "q1", text: "What specific data transformation or calculation needs to be performed?", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Who will be using this script and what is their technical proficiency?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q3", text: "What volume of data will the script typically process?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "Should the script run automatically on a schedule or be manually triggered?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q5", text: "What is the ultimate business goal of this spreadsheet automation?", isRelevant: null, answer: "", category: "Task" },
      { id: "q6", text: "What specific validation or error handling is required?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q7", text: "How should the script's output be formatted or presented?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q8", text: "Who needs to maintain or modify this script in the future?", isRelevant: null, answer: "", category: "Persona" },
    ];
  }
  
  // For email-related prompts
  if (lowerPrompt.includes('email') || lowerPrompt.includes('message') || lowerPrompt.includes('communication')) {
    return [
      { id: "q1", text: "What is the primary purpose of this email or message?", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Who is the recipient and what is your relationship with them?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q3", text: "Are there any sensitive topics or issues that need special handling?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "What specific action do you want the recipient to take after reading?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q5", text: "What key information must be included in this communication?", isRelevant: null, answer: "", category: "Task" },
      { id: "q6", text: "What tone and level of formality is appropriate for this audience?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q7", text: "What is the maximum length or time constraint for this message?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q8", text: "How should supporting information or attachments be organized?", isRelevant: null, answer: "", category: "Instructions" },
    ];
  }
  
  // For coding/programming tasks
  if (lowerPrompt.includes('code') || lowerPrompt.includes('script') || lowerPrompt.includes('program') || lowerPrompt.includes('function')) {
    return [
      { id: "q1", text: "What is the core functionality this code needs to implement?", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Who will be using or maintaining this code in the future?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q3", text: "What are the performance requirements or constraints?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "What coding style or patterns should the implementation follow?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q5", text: "What inputs and outputs should this code handle?", isRelevant: null, answer: "", category: "Task" },
      { id: "q6", text: "What level of technical expertise will users or maintainers have?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q7", text: "What dependencies or libraries are available or preferred?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q8", text: "How should errors and edge cases be handled?", isRelevant: null, answer: "", category: "Instructions" },
    ];
  }
  
  // For creative writing
  if (lowerPrompt.includes('write') || lowerPrompt.includes('story') || lowerPrompt.includes('article') || lowerPrompt.includes('blog')) {
    return [
      { id: "q1", text: "What is the main theme or message to convey?", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Who is the target audience for this content?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q3", text: "What word count or length constraints apply?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "What structural elements or sections should be included?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q5", text: "What specific topics or keywords must be covered?", isRelevant: null, answer: "", category: "Task" },
      { id: "q6", text: "What tone, style, or voice is appropriate for the audience?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q7", text: "Are there any content restrictions or guidelines to follow?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q8", text: "How should research or supporting information be incorporated?", isRelevant: null, answer: "", category: "Instructions" },
    ];
  }
  
  // For data analysis or reporting
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('report') || lowerPrompt.includes('data') || lowerPrompt.includes('statistics')) {
    return [
      { id: "q1", text: "What key insights or patterns need to be identified in this data?", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Who will be consuming this analysis and what decisions will they make with it?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q3", text: "What is the time period or scope of the data being analyzed?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "What visualization formats or analytical methods should be used?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q5", text: "What specific metrics or KPIs must be included in the analysis?", isRelevant: null, answer: "", category: "Task" },
      { id: "q6", text: "What level of technical expertise does the audience have?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q7", text: "What data quality issues or limitations need to be considered?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q8", text: "How should conclusions and recommendations be presented?", isRelevant: null, answer: "", category: "Instructions" },
    ];
  }
  
  // Default to general context questions
  return [
    { id: "q1", text: "What specific outcome or result are you looking to achieve?", isRelevant: null, answer: "", category: "Task" },
    { id: "q2", text: "Who is the intended audience or end user for this output?", isRelevant: null, answer: "", category: "Persona" },
    { id: "q3", text: "What constraints, limitations, or requirements must be considered?", isRelevant: null, answer: "", category: "Conditions" },
    { id: "q4", text: "What process, methodology, or approach should be followed?", isRelevant: null, answer: "", category: "Instructions" },
    { id: "q5", text: "What metrics will define a successful outcome for this task?", isRelevant: null, answer: "", category: "Task" },
    { id: "q6", text: "What tone, style, or perspective is appropriate for the audience?", isRelevant: null, answer: "", category: "Persona" },
    { id: "q7", text: "What contextual factors or background information is relevant?", isRelevant: null, answer: "", category: "Conditions" },
    { id: "q8", text: "How should the information be structured or presented?", isRelevant: null, answer: "", category: "Instructions" },
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
      { id: "v1", name: "DataRange", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "OutputSheet", value: "", isRelevant: null, category: "Task" },
      { id: "v3", name: "RunFrequency", value: "", isRelevant: null, category: "Conditions" },
      { id: "v4", name: "ErrorHandling", value: "", isRelevant: null, category: "Conditions" },
      { id: "v5", name: "UserLevel", value: "", isRelevant: null, category: "Persona" },
      { id: "v6", name: "FormattingStyle", value: "", isRelevant: null, category: "Instructions" },
      { id: "v7", name: "ValidationRules", value: "", isRelevant: null, category: "Instructions" },
      { id: "v8", name: "BackupFrequency", value: "", isRelevant: null, category: "Conditions" },
    ];
  }
  
  // For email-related prompts
  if (promptContext.includes("email") || promptContext.includes("message")) {
    return [
      { id: "v1", name: "EmailPurpose", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "RecipientName", value: "", isRelevant: null, category: "Persona" },
      { id: "v3", name: "RelationshipContext", value: "", isRelevant: null, category: "Persona" },
      { id: "v4", name: "EmailTone", value: "", isRelevant: null, category: "Persona" },
      { id: "v5", name: "MessageLength", value: "", isRelevant: null, category: "Conditions" },
      { id: "v6", name: "ResponseDeadline", value: "", isRelevant: null, category: "Conditions" },
      { id: "v7", name: "CallToAction", value: "", isRelevant: null, category: "Instructions" },
      { id: "v8", name: "FollowupPlan", value: "", isRelevant: null, category: "Instructions" },
    ];
  }
  
  // For content creation prompts
  if (promptContext.includes("content") || promptContext.includes("write") || promptContext.includes("article")) {
    return [
      { id: "v1", name: "ContentGoal", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "KeyTopics", value: "", isRelevant: null, category: "Task" },
      { id: "v3", name: "TargetAudience", value: "", isRelevant: null, category: "Persona" },
      { id: "v4", name: "ContentTone", value: "", isRelevant: null, category: "Persona" },
      { id: "v5", name: "WordCount", value: "", isRelevant: null, category: "Conditions" },
      { id: "v6", name: "PublishPlatform", value: "", isRelevant: null, category: "Conditions" },
      { id: "v7", name: "ContentStructure", value: "", isRelevant: null, category: "Instructions" },
      { id: "v8", name: "SEORequirements", value: "", isRelevant: null, category: "Instructions" },
    ];
  }
  
  // For code-related prompts
  if (promptContext.includes("code") || promptContext.includes("programming") || promptContext.includes("develop")) {
    return [
      { id: "v1", name: "CodeFunction", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "Language", value: "", isRelevant: null, category: "Task" },
      { id: "v3", name: "DeveloperLevel", value: "", isRelevant: null, category: "Persona" },
      { id: "v4", name: "MaintainerProfile", value: "", isRelevant: null, category: "Persona" },
      { id: "v5", name: "PerformanceNeeds", value: "", isRelevant: null, category: "Conditions" },
      { id: "v6", name: "Dependencies", value: "", isRelevant: null, category: "Conditions" },
      { id: "v7", name: "CodingStyle", value: "", isRelevant: null, category: "Instructions" },
      { id: "v8", name: "TestingApproach", value: "", isRelevant: null, category: "Instructions" },
    ];
  }
  
  // For data analysis prompts
  if (promptContext.includes("data") || promptContext.includes("analyze") || promptContext.includes("report")) {
    return [
      { id: "v1", name: "AnalysisGoal", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "KeyMetrics", value: "", isRelevant: null, category: "Task" },
      { id: "v3", name: "StakeholderType", value: "", isRelevant: null, category: "Persona" },
      { id: "v4", name: "TechnicalLevel", value: "", isRelevant: null, category: "Persona" },
      { id: "v5", name: "DataTimeframe", value: "", isRelevant: null, category: "Conditions" },
      { id: "v6", name: "DataLimitations", value: "", isRelevant: null, category: "Conditions" },
      { id: "v7", name: "VisualizationType", value: "", isRelevant: null, category: "Instructions" },
      { id: "v8", name: "InsightFormat", value: "", isRelevant: null, category: "Instructions" },
    ];
  }
  
  // Default variables
  return [
    { id: "v1", name: "TaskGoal", value: "", isRelevant: null, category: "Task" },
    { id: "v2", name: "SuccessMetrics", value: "", isRelevant: null, category: "Task" },
    { id: "v3", name: "AudienceType", value: "", isRelevant: null, category: "Persona" },
    { id: "v4", name: "ToneStyle", value: "", isRelevant: null, category: "Persona" },
    { id: "v5", name: "TimeConstraints", value: "", isRelevant: null, category: "Conditions" },
    { id: "v6", name: "ResourceLimits", value: "", isRelevant: null, category: "Conditions" },
    { id: "v7", name: "ProcessMethod", value: "", isRelevant: null, category: "Instructions" },
    { id: "v8", name: "OutputFormat", value: "", isRelevant: null, category: "Instructions" },
  ];
}
