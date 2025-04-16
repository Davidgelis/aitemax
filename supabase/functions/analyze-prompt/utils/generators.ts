// Helper functions to generate fallback data

/**
 * Generate context-appropriate questions based on prompt text
 */
export function generateContextQuestionsForPrompt(promptText: string): any[] {
  const lowerPrompt = promptText.toLowerCase();

  // Define common technical terms that might need explanation
  const commonTechnicalTerms = {
    api: {
      explanation: "Application Programming Interface - A way for different software systems to communicate",
      example: "Like a waiter taking orders between restaurant customers and the kitchen"
    },
    database: {
      explanation: "A system for storing and organizing information",
      example: "Like a digital filing cabinet for your app's information"
    },
    authentication: {
      explanation: "The process of verifying who a user is",
      example: "Like checking ID at the entrance of a building"
    },
    encryption: {
      explanation: "A way to secure sensitive information",
      example: "Like using a secret code to protect messages"
    }
  };

  // Helper function to check for technical terms and add explanations
  const addTechnicalTerms = (question: any) => {
    const terms = [];
    for (const [term, info] of Object.entries(commonTechnicalTerms)) {
      if (question.text.toLowerCase().includes(term)) {
        terms.push({
          term,
          explanation: info.explanation,
          example: info.example
        });
      }
    }
    if (terms.length > 0) {
      question.technicalTerms = terms;
    }
    return question;
  };

  // For Google Sheets / spreadsheet scripts
  if (lowerPrompt.includes('google sheet') || lowerPrompt.includes('spreadsheet') || lowerPrompt.includes('excel')) {
    return [
      { id: "q1", text: "What do you want to do with the spreadsheet data? (For example: calculate totals, organize information, or create reports)", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Who will be using this spreadsheet tool and how comfortable are they with technology?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q3", text: "How much information will this need to handle? (For example: hundreds of rows, thousands, or millions)", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "Would you like this to run automatically or when someone clicks a button?", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q5", text: "What problem are you trying to solve with this spreadsheet automation?", isRelevant: null, answer: "", category: "Task" },
      { id: "q6", text: "What should happen if there's a mistake in the data? (For example: show an error message, skip the row, or use a default value)", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q7", text: "How would you like to see the results? (For example: in a new sheet, as a chart, or in a summary)", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q8", text: "Will someone else need to update or change how this works in the future?", isRelevant: null, answer: "", category: "Persona" },
    ].map(addTechnicalTerms);
  }

  // For coding/programming tasks
  if (lowerPrompt.includes('code') || lowerPrompt.includes('script') || lowerPrompt.includes('program') || lowerPrompt.includes('function')) {
    return [
      { id: "q1", text: "What should this program do in simple terms? (Think of it like giving instructions to a helper)", isRelevant: null, answer: "", category: "Task" },
      { id: "q2", text: "Who will be using this tool and what's their technical background?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q3", text: "How fast does this need to work? (For example: instant response, within a few seconds, or can take longer)", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q4", text: "Should this follow any specific way of doing things? (Like company guidelines or best practices)", isRelevant: null, answer: "", category: "Instructions" },
      { id: "q5", text: "What information goes in and what should come out? (Like a recipe's ingredients and final dish)", isRelevant: null, answer: "", category: "Task" },
      { id: "q6", text: "Who will need to understand or modify this code later?", isRelevant: null, answer: "", category: "Persona" },
      { id: "q7", text: "Are there any specific tools or systems this needs to work with?", isRelevant: null, answer: "", category: "Conditions" },
      { id: "q8", text: "What should happen when something goes wrong? (For example: show an error message, try again, or have a backup plan)", isRelevant: null, answer: "", category: "Instructions" },
    ].map(addTechnicalTerms);
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
    ].map(addTechnicalTerms);
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
    ].map(addTechnicalTerms);
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
    ].map(addTechnicalTerms);
  }
  
  // Default questions updated to be more user-friendly
  return [
    { id: "q1", text: "What are you trying to achieve? (Describe it like you would to a friend)", isRelevant: null, answer: "", category: "Task" },
    { id: "q2", text: "Who is this for and what do they need to know to use it?", isRelevant: null, answer: "", category: "Persona" },
    { id: "q3", text: "Are there any limitations or requirements we should know about?", isRelevant: null, answer: "", category: "Conditions" },
    { id: "q4", text: "How would you like this to work, step by step?", isRelevant: null, answer: "", category: "Instructions" },
    { id: "q5", text: "How will you know if this is successful? (What would make you happy with the result?)", isRelevant: null, answer: "", category: "Task" },
    { id: "q6", text: "What kind of language or style should be used?", isRelevant: null, answer: "", category: "Persona" },
    { id: "q7", text: "Is there any background information that would help understand this better?", isRelevant: null, answer: "", category: "Conditions" },
    { id: "q8", text: "How should the information be organized or presented?", isRelevant: null, answer: "", category: "Instructions" },
  ].map(addTechnicalTerms);
}

/**
 * Generate context-appropriate variables based on prompt text
 */
export function generateContextualVariablesForPrompt(promptText: string): any[] {
  const promptContext = promptText.toLowerCase();
  
  // Define common technical terms lookup
  const technicalTermsLookup = {
    range: {
      term: "Range",
      explanation: "A selection of cells in a spreadsheet, like A1:B10. It defines which cells to work with.",
      example: "A2:F10 selects all cells from A2 to F10"
    },
    formula: {
      term: "Formula",
      explanation: "A calculation that performs operations on spreadsheet values. Starts with =",
      example: "=SUM(A1:A10) adds up all numbers in cells A1 through A10"
    },
    api: {
      term: "API",
      explanation: "A way for different software systems to communicate and share data.",
      example: "Like ordering food through a delivery app's interface"
    },
    database: {
      term: "Database",
      explanation: "A system for storing and organizing information digitally.",
      example: "Like a digital filing cabinet for your app's data"
    },
    function: {
      term: "Function",
      explanation: "A reusable piece of code that performs a specific task.",
      example: "Like a recipe that takes ingredients and produces a dish"
    },
    variable: {
      term: "Variable",
      explanation: "A container that stores a value that can change.",
      example: "Like a labeled box where you can put different items"
    }
  };

  // Helper function to add technical terms to variables
  const addTechnicalTerms = (variable: any) => {
    const terms = [];
    for (const [term, info] of Object.entries(technicalTermsLookup)) {
      if (variable.name.toLowerCase().includes(term) || 
          (variable.description && variable.description.toLowerCase().includes(term))) {
        terms.push(info);
      }
    }
    if (terms.length > 0) {
      variable.technicalTerms = terms;
    }
    return variable;
  };

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
    ].map(addTechnicalTerms);
  }

  // For code-related prompts
  if (promptContext.includes('code') || promptContext.includes('programming') || promptContext.includes('develop')) {
    return [
      { id: "v1", name: "CodeFunction", value: "", isRelevant: null, category: "Task" },
      { id: "v2", name: "Language", value: "", isRelevant: null, category: "Task" },
      { id: "v3", name: "DeveloperLevel", value: "", isRelevant: null, category: "Persona" },
      { id: "v4", name: "MaintainerProfile", value: "", isRelevant: null, category: "Persona" },
      { id: "v5", name: "PerformanceNeeds", value: "", isRelevant: null, category: "Conditions" },
      { id: "v6", name: "Dependencies", value: "", isRelevant: null, category: "Conditions" },
      { id: "v7", name: "CodingStyle", value: "", isRelevant: null, category: "Instructions" },
      { id: "v8", name: "TestingApproach", value: "", isRelevant: null, category: "Instructions" },
    ].map(addTechnicalTerms);
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
