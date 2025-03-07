
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { analyzePromptWithAI } from "./openai-client.ts";
import { createSystemPrompt } from "./system-prompt.ts";
import { 
  extractQuestions, 
  extractVariables, 
  extractMasterCommand, 
  extractEnhancedPrompt,
  extractImpliedVariablesFromPrompt
} from "./utils/extractors.ts";
import { 
  generateContextQuestionsForPrompt,
  generateContextualVariablesForPrompt
} from "./utils/generators.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to calculate token costs
function calculateTokenCosts(promptTokens: number, completionTokens: number) {
  // GPT-4o pricing: $0.00250 per 1K prompt tokens, $0.00750 per 1K completion tokens
  const promptCost = (promptTokens / 1000) * 0.00250;
  const completionCost = (completionTokens / 1000) * 0.00750;
  return {
    promptCost,
    completionCost,
    totalCost: promptCost + completionCost
  };
}

// Helper function to record token usage in Supabase
async function recordTokenUsage(
  userId: string, 
  promptId: string | null,
  step: number,
  promptTokens: number, 
  completionTokens: number, 
  model: string
) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials missing, token usage will not be recorded");
    return;
  }

  const costs = calculateTokenCosts(promptTokens, completionTokens);
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/token_usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        prompt_id: promptId,
        step,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        prompt_cost: costs.promptCost,
        completion_cost: costs.completionCost,
        total_cost: costs.totalCost,
        model
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error recording token usage:", errorData);
    } else {
      console.log(`Token usage recorded successfully for user ${userId} at step ${step}`);
    }
  } catch (error) {
    console.error("Error recording token usage:", error);
  }
}

// Enhanced function to check if text looks like a placeholder with more sophisticated detection
function isPlaceholderText(text: string): boolean {
  // If text is empty or too short, consider it placeholder
  if (!text || text.trim().length < 5) return true;
  
  // Common placeholder terms and phrases
  const placeholderPatterns = [
    /start by typing your prompt/i,
    /for example:/i,
    /create an email template/i,
    /write a prompt for/i,
    /placeholder/i,
    /sample text/i,
    /example prompt/i,
    /input your prompt/i,
    /type here/i,
    /enter your prompt/i,
    /prompt goes here/i,
    /sample prompt/i
  ];
  
  // Check if the text contains well-known placeholder patterns
  const containsPlaceholder = placeholderPatterns.some(pattern => pattern.test(text));
  if (containsPlaceholder) return true;
  
  // Check if the text is too generic/instructional rather than an actual prompt
  const instructionalPatterns = [
    /^\s*what do you want .+? to do/i,
    /^\s*how can I help you/i,
    /^\s*tell me what you need/i,
    /^\s*describe what you want/i
  ];
  
  return instructionalPatterns.some(pattern => pattern.test(text));
}

// Function to strip out placeholder text if it contains real content too
function cleanPlaceholderText(text: string): string {
  // Check if the text contains both placeholder and real content
  const placeholderLines = [
    "Start by typing your prompt",
    "For example:",
    "Create an email template",
    "Write a prompt for",
    "Input your prompt",
    "Sample text",
    "Example prompt",
    "Type here",
    "Enter your prompt",
    "Prompt goes here",
    "Sample prompt"
  ];
  
  let cleanedText = text;
  
  // Remove common placeholder lines while preserving user content
  placeholderLines.forEach(line => {
    // Case insensitive replacement of placeholder lines
    const regex = new RegExp(`^\\s*${line}.*$`, 'im');
    cleanedText = cleanedText.replace(regex, '');
  });
  
  // Remove common example prompts if they appear to be placeholders
  if (cleanedText.includes('Create an email template for customer onboarding')) {
    cleanedText = cleanedText.replace(/Create an email template for customer onboarding/g, '');
  }
  
  if (cleanedText.includes('Write a prompt for generating code documentation')) {
    cleanedText = cleanedText.replace(/Write a prompt for generating code documentation/g, '');
  }
  
  return cleanedText.trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { promptText, primaryToggle, secondaryToggle, userId, promptId } = await req.json();
    
    // Clean the prompt text of placeholder content
    const cleanedPromptText = cleanPlaceholderText(promptText);
    
    // Extract variables directly from the prompt as a first pass
    const directVariables = extractImpliedVariablesFromPrompt(cleanedPromptText);
    
    // Skip analysis if the text appears to be only a placeholder or example
    if (isPlaceholderText(promptText) || !cleanedPromptText) {
      console.log("Detected placeholder text, returning fallback analysis");
      return new Response(JSON.stringify({
        questions: generateContextQuestionsForPrompt(""),
        variables: directVariables.length > 0 ? directVariables : generateContextualVariablesForPrompt(""),
        masterCommand: "Please provide a specific prompt to analyze",
        enhancedPrompt: "# Please Replace Placeholder Text\n\nPlease replace the placeholder text with your actual prompt to receive a proper analysis.",
        error: "Placeholder text detected"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Analyzing prompt: "${cleanedPromptText}"\n`);
    console.log(`Primary toggle: ${primaryToggle || "None"}`);
    console.log(`Secondary toggle: ${secondaryToggle || "None"}`);
    
    // Create a system message with better context about our purpose
    const systemMessage = createSystemPrompt(primaryToggle, secondaryToggle);
    
    // Get analysis from OpenAI
    const analysisResult = await analyzePromptWithAI(cleanedPromptText, systemMessage.content, openAIApiKey);
    const analysis = analysisResult.content;
    
    // Record token usage for this step if userId is provided
    if (userId && analysisResult.usage) {
      await recordTokenUsage(
        userId,
        promptId,
        1, // Step 1: Initial prompt analysis
        analysisResult.usage.prompt_tokens,
        analysisResult.usage.completion_tokens,
        'gpt-4o'
      );
    }
    
    // Try to extract structured data from the analysis
    try {
      // Process the analysis to extract questions, variables, etc.
      const questions = extractQuestions(analysis, cleanedPromptText);
      
      // Get variables from both the analysis and direct extraction from prompt
      // and combine them, prioritizing the AI analysis but ensuring we have variables from the prompt too
      const analysisVariables = extractVariables(analysis, cleanedPromptText);
      
      // If we don't have variables from analysis, use the directly extracted ones
      const variables = analysisVariables.length > 0 ? 
        analysisVariables : 
        directVariables.length > 0 ? 
          directVariables : 
          generateContextualVariablesForPrompt(cleanedPromptText);
      
      const masterCommand = extractMasterCommand(analysis);
      const enhancedPrompt = extractEnhancedPrompt(analysis);
      
      const result = {
        questions,
        variables,
        masterCommand,
        enhancedPrompt,
        rawAnalysis: analysis,
        usage: analysisResult.usage
      };
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (extractionError) {
      console.error("Error extracting structured data from analysis:", extractionError);
      
      // Directly extract variables from the prompt text as fallback
      const directVariables = extractImpliedVariablesFromPrompt(cleanedPromptText);
      
      // Fallback to context-specific questions
      const contextQuestions = generateContextQuestionsForPrompt(cleanedPromptText);
      
      // Fallback to mock data but still return a 200 status code
      return new Response(JSON.stringify({
        questions: contextQuestions,
        variables: directVariables.length > 0 ? directVariables : generateContextualVariablesForPrompt(cleanedPromptText),
        masterCommand: "Analyzed prompt: " + cleanedPromptText.substring(0, 50) + "...",
        enhancedPrompt: "# Enhanced Prompt\n\n" + cleanedPromptText,
        error: extractionError.message,
        rawAnalysis: analysis,
        usage: analysisResult.usage
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Error in analyze-prompt function:", error);
    
    // Always return a 200 status code even on error, with error details in the response body
    return new Response(JSON.stringify({
      questions: generateContextQuestionsForPrompt(""),
      variables: generateContextualVariablesForPrompt(""),
      masterCommand: "Error analyzing prompt",
      enhancedPrompt: "# Error\n\nThere was an error analyzing your prompt. Please try again.",
      error: error.message
    }), {
      status: 200, // Always return 200 to avoid the edge function error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
