
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { promptText, primaryToggle, secondaryToggle } = await req.json();
    
    console.log(`Analyzing prompt: "${promptText}"\n`);
    
    // Create a system message with better context about our purpose
    const systemMessage = `
      You are an AI prompt engineer specializing in analyzing and enhancing prompts.
      
      Your task is to analyze a user's prompt and extract essential information to help create a well-structured prompt template.
      
      Important context:
      - The purpose of this analysis is to help ANOTHER AI generate a better structured prompt.
      - Don't ask redundant questions that would be obvious to an AI.
      - Focus on extracting unique variables and asking clarifying questions that will meaningfully improve the prompt.
      - The final goal is to structure a prompt with these four key pillars: Task, Persona, Conditions, and Instructions.
      
      Your output must include:
      1. A set of targeted questions to fill important gaps in the prompt structure, organized by category.
      2. A set of SPECIFIC variables for customization - these should be CONTEXTUAL words or phrases that can be replaced without changing the prompt meaning.
         - For example, if the prompt is about emails, variables might include: {{RecipientName}}, {{EmailTopic}}, {{DesiredTone}}, {{ParagraphCount}}, {{SignatureLine}}
         - DO NOT use generic variables like "TaskType" or "Audience" - use specific names based on the context
         - Variables should represent changeable elements that users might want to adjust later
      3. A master command describing the essence of what the user wants.
      4. An enhanced version of the original prompt that follows best practices.

      Base your analysis on the context and tone indicated by the selected toggles:
      - Primary toggle: ${primaryToggle || 'None'}
      - Secondary toggle: ${secondaryToggle || 'None'}
      
      IMPORTANT: Only ask questions that provide genuinely NEW information. Don't ask for information that:
      - Is already in the original prompt
      - Would be obvious to an AI based on context
      - Doesn't meaningfully improve the prompt structure
    `;
    
    const userMessage = `Analyze this prompt: "${promptText}"`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API responded with status ${response.status}: ${errorData}`);
    }
    
    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    // Try to extract structured data from the analysis
    try {
      // Process the analysis to extract questions, variables, etc.
      const questions = extractQuestions(analysis);
      const variables = extractVariables(analysis);
      const masterCommand = extractMasterCommand(analysis);
      const enhancedPrompt = extractEnhancedPrompt(analysis);
      
      const result = {
        questions,
        variables,
        masterCommand,
        enhancedPrompt,
        rawAnalysis: analysis
      };
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (extractionError) {
      console.error("Error extracting structured data from analysis:", extractionError);
      
      // Fallback to mock data but still return a 200 status code
      return new Response(JSON.stringify({
        questions: generateMockQuestions(),
        variables: generateMockVariables(),
        masterCommand: "Analyzed prompt: " + promptText.substring(0, 50) + "...",
        enhancedPrompt: "# Enhanced Prompt\n\n" + promptText,
        error: extractionError.message,
        rawAnalysis: analysis
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Error in analyze-prompt function:", error);
    
    // Always return a 200 status code even on error, with error details in the response body
    return new Response(JSON.stringify({
      questions: generateMockQuestions(),
      variables: generateMockVariables(),
      masterCommand: "Error analyzing prompt",
      enhancedPrompt: "# Error\n\nThere was an error analyzing your prompt. Please try again.",
      error: error.message
    }), {
      status: 200, // Always return 200 to avoid the edge function error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to extract questions from the analysis
function extractQuestions(analysis) {
  // Try to find a JSON block containing questions
  const jsonMatch = analysis.match(/```json\s*({[\s\S]*?})\s*```/);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsedJson = JSON.parse(jsonMatch[1]);
      if (parsedJson.questions && Array.isArray(parsedJson.questions)) {
        return parsedJson.questions.map((q, i) => ({
          id: q.id || `q${i+1}`,
          text: q.text,
          category: q.category || getCategoryFromText(q.text),
          isRelevant: null,
          answer: ""
        }));
      }
    } catch (e) {
      console.error("Error parsing JSON from analysis:", e);
    }
  }
  
  // Fallback: Look for questions with regex
  const questions = [];
  const questionMatches = analysis.matchAll(/(?:Question|Q)(?:\s+\d+)?(?:\s*\(([^)]+)\))?:\s*(.+?)(?=\n|$)/g);
  
  for (const match of questionMatches) {
    const category = match[1] || getCategoryFromText(match[2]);
    const text = match[2].trim();
    
    if (text) {
      questions.push({
        id: `q${questions.length + 1}`,
        text,
        category,
        isRelevant: null,
        answer: ""
      });
    }
  }
  
  if (questions.length > 0) {
    return questions;
  }
  
  // If still no questions found, look for bullet points that end with question marks
  const bulletQuestionMatches = analysis.matchAll(/(?:[-*•]\s*)(.+?\?)/g);
  
  for (const match of bulletQuestionMatches) {
    const text = match[1].trim();
    
    if (text) {
      questions.push({
        id: `q${questions.length + 1}`,
        text,
        category: getCategoryFromText(text),
        isRelevant: null,
        answer: ""
      });
    }
  }
  
  return questions.length > 0 ? questions : generateMockQuestions();
}

// Helper function to extract variables from the analysis
function extractVariables(analysis) {
  // Try to find a JSON block containing variables
  const jsonMatch = analysis.match(/```json\s*({[\s\S]*?})\s*```/);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsedJson = JSON.parse(jsonMatch[1]);
      if (parsedJson.variables && Array.isArray(parsedJson.variables)) {
        return parsedJson.variables.map((v, i) => ({
          id: v.id || `v${i+1}`,
          name: v.name,
          value: v.value || "",
          isRelevant: null,
          category: v.category || "Task"
        }));
      }
    } catch (e) {
      console.error("Error parsing JSON from analysis:", e);
    }
  }
  
  // Check for variable patterns like {{VariableName}}
  let enhancedPrompt = extractEnhancedPrompt(analysis);
  const contextualVariables = [];
  const variableRegex = /{{(\w+)}}/g;
  let match;
  
  while ((match = variableRegex.exec(enhancedPrompt)) !== null) {
    const name = match[1];
    // Check if variable already exists
    if (!contextualVariables.some(v => v.name === name)) {
      contextualVariables.push({
        id: `v${contextualVariables.length + 1}`,
        name,
        value: "",
        isRelevant: null,
        category: getCategoryFromVariableName(name)
      });
    }
  }
  
  if (contextualVariables.length > 0) {
    return contextualVariables;
  }
  
  // Fallback: Look for variable definitions in the text
  const variables = [];
  // Look for lines like "Variable: Name = Value" or "{{Name}}: Description"
  const variableDefMatches = analysis.matchAll(/(?:Variable|Var|\*\*|-)(?:\s+\d+)?(?:\s*\(([^)]+)\))?:?\s*(?:{{)?(\w+)(?:}})?(?:\s*[:=]\s*(.+?))?(?=\n|$)/g);
  
  for (const match of variableDefMatches) {
    const category = match[1] || getCategoryFromVariableName(match[2]);
    const name = match[2].trim();
    const value = match[3] ? match[3].trim() : "";
    
    if (name && !variables.some(v => v.name === name)) {
      variables.push({
        id: `v${variables.length + 1}`,
        name,
        value,
        isRelevant: null,
        category
      });
    }
  }
  
  // If we found some contextual variables in the analysis
  if (variables.length > 0) {
    return variables;
  }
  
  // If we still haven't found any variables, generate contextual ones based on the prompt content
  const promptContext = analysis.toLowerCase();
  
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
  
  // Default to generated mock variables if none of the above patterns match
  return generateContextualMockVariables();
}

// Helper function to extract master command from the analysis
function extractMasterCommand(analysis) {
  // Look for explicit "Master Command" section
  const masterCommandMatch = analysis.match(/(?:Master Command|Command|Purpose)(?:\s*:|\n)\s*(.+?)(?=\n\n|\n#|$)/s);
  
  if (masterCommandMatch && masterCommandMatch[1]) {
    return masterCommandMatch[1].trim();
  }
  
  // Look for "Enhanced Prompt" title as a fallback
  const titleMatch = analysis.match(/# (.+?)(?=\n|$)/);
  if (titleMatch && titleMatch[1] && !titleMatch[1].toLowerCase().includes("enhanced prompt")) {
    return titleMatch[1].trim();
  }
  
  return "Create a well-structured prompt based on the input";
}

// Helper function to extract enhanced prompt from the analysis
function extractEnhancedPrompt(analysis) {
  // Look for a markdown code block
  const codeBlockMatch = analysis.match(/```(?:markdown|md)?\s*([\s\S]*?)```/);
  
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }
  
  // Look for a section labeled as "Enhanced Prompt"
  const enhancedPromptMatch = analysis.match(/(?:# Enhanced Prompt|## Enhanced Prompt)(?:\s*:|\n)([\s\S]*?)(?=\n# |\n## |$)/s);
  
  if (enhancedPromptMatch && enhancedPromptMatch[1]) {
    return enhancedPromptMatch[1].trim();
  }
  
  // If all else fails, just return sections after "Task", "Persona", etc.
  const structuredSections = analysis.match(/((?:# |## )(?:Task|Persona|Conditions|Instructions)(?:\s*:|\n)[\s\S]*?)(?=\n# |\n## |$)/g);
  
  if (structuredSections && structuredSections.length > 0) {
    return `# Enhanced Prompt Template\n\n${structuredSections.join('\n\n')}`;
  }
  
  return "# Enhanced Prompt\n\nYour enhanced prompt will appear here after answering the questions.";
}

// Helper function to determine category based on question text
function getCategoryFromText(text) {
  text = text.toLowerCase();
  
  if (text.includes("what") || text.includes("goal") || text.includes("objective") || text.includes("accomplish")) {
    return "Task";
  } else if (text.includes("who") || text.includes("audience") || text.includes("tone") || text.includes("persona")) {
    return "Persona";
  } else if (text.includes("limit") || text.includes("constraint") || text.includes("avoid") || text.includes("how long") || text.includes("word count")) {
    return "Conditions";
  } else {
    return "Instructions";
  }
}

// Helper function to determine category based on variable name
function getCategoryFromVariableName(name) {
  name = name.toLowerCase();
  
  // More specific variable categorization
  if (name.includes("recipient") || name.includes("audience") || name.includes("user") || name.includes("tone") || name.includes("voice")) {
    return "Persona";
  } else if (name.includes("count") || name.includes("limit") || name.includes("length") || name.includes("number") || name.includes("time")) {
    return "Conditions";
  } else if (name.includes("format") || name.includes("step") || name.includes("signature") || name.includes("style") || name.includes("method")) {
    return "Instructions";
  } else {
    return "Task";
  }
}

// Helper function to generate mock questions if extraction fails
function generateMockQuestions() {
  return [
    { id: "q1", text: "What specific task or output are you looking to accomplish?", isRelevant: null, answer: "", category: "Task" },
    { id: "q2", text: "Who is the intended audience or recipient?", isRelevant: null, answer: "", category: "Persona" },
    { id: "q3", text: "Are there any constraints or limitations to be aware of?", isRelevant: null, answer: "", category: "Conditions" },
    { id: "q4", text: "What specific instructions or format requirements do you have?", isRelevant: null, answer: "", category: "Instructions" }
  ];
}

// Helper function to generate contextual mock variables
function generateContextualMockVariables() {
  return [
    { id: "v1", name: "TaskDescription", value: "", isRelevant: null, category: "Task" },
    { id: "v2", name: "RecipientName", value: "", isRelevant: null, category: "Persona" },
    { id: "v3", name: "WordCount", value: "", isRelevant: null, category: "Conditions" },
    { id: "v4", name: "FormatStyle", value: "", isRelevant: null, category: "Instructions" }
  ];
}

// Legacy function needed for compatibility
function generateMockVariables() {
  return generateContextualMockVariables();
}

