
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
      2. A set of variables for customization (with empty values for the user to fill in).
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
  
  // Fallback: Look for variables with regex
  const variables = [];
  const variableMatches = analysis.matchAll(/(?:Variable|Var)(?:\s+\d+)?(?:\s*\(([^)]+)\))?:\s*(\w+)(?:\s*=\s*(.+?))?(?=\n|$)/g);
  
  for (const match of variableMatches) {
    const category = match[1] || "Task";
    const name = match[2].trim();
    const value = match[3] ? match[3].trim() : "";
    
    if (name) {
      variables.push({
        id: `v${variables.length + 1}`,
        name,
        value,
        isRelevant: null,
        category
      });
    }
  }
  
  if (variables.length > 0) {
    return variables;
  }
  
  // Second fallback: Look for `{{VariableName}}` patterns in the enhanced prompt
  const enhancedPrompt = extractEnhancedPrompt(analysis);
  const variableRegex = /{{(\w+)}}/g;
  let match;
  
  while ((match = variableRegex.exec(enhancedPrompt)) !== null) {
    const name = match[1];
    
    // Check if variable already exists
    if (!variables.some(v => v.name === name)) {
      variables.push({
        id: `v${variables.length + 1}`,
        name,
        value: "",
        isRelevant: null,
        category: getCategoryFromVariable(name)
      });
    }
  }
  
  return variables.length > 0 ? variables : generateMockVariables();
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
function getCategoryFromVariable(name) {
  name = name.toLowerCase();
  
  if (name.includes("task") || name.includes("goal") || name.includes("objective") || name.includes("outcome")) {
    return "Task";
  } else if (name.includes("tone") || name.includes("audience") || name.includes("persona") || name.includes("recipient")) {
    return "Persona";
  } else if (name.includes("limit") || name.includes("count") || name.includes("time") || name.includes("length")) {
    return "Conditions";
  } else {
    return "Instructions";
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

// Helper function to generate mock variables if extraction fails
function generateMockVariables() {
  return [
    { id: "v1", name: "TaskType", value: "", isRelevant: null, category: "Task" },
    { id: "v2", name: "Audience", value: "", isRelevant: null, category: "Persona" },
    { id: "v3", name: "Constraints", value: "", isRelevant: null, category: "Conditions" },
    { id: "v4", name: "Format", value: "", isRelevant: null, category: "Instructions" }
  ];
}
