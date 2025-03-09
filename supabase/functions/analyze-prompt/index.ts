
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { analyzePromptWithAI } from "./openai-client.ts";
import { createSystemPrompt } from "./system-prompt.ts";
import { 
  extractQuestions, 
  extractVariables, 
  extractMasterCommand, 
  extractEnhancedPrompt 
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

// Helper function to fetch content from a URL
async function fetchWebsiteContent(url: string) {
  console.log(`Fetching content from website: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch website, status: ${response.status}`);
    }
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "Unknown Title";
    
    // Simple extraction of text by removing HTML tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    text = text.replace(/<[^>]*>?/gm, ' ');
    text = text.replace(/\s+/g, ' ').trim().substring(0, 8000); // Limit length
    
    return { title, text };
  } catch (error) {
    console.error(`Error fetching website content: ${error.message}`);
    return { title: "Error", text: `Failed to fetch website content: ${error.message}` };
  }
}

// Function to extract relevant keywords and terms from text or image analysis
function extractKeyTerms(text: string): string[] {
  // Extract potential keywords (nouns, technical terms, etc.)
  const words = text.toLowerCase().split(/\s+/);
  
  // Filter common words and keep only potential keywords
  const commonWords = new Set(['a', 'an', 'the', 'is', 'are', 'and', 'or', 'for', 'to', 'in', 'on', 'with', 'by', 'at', 'from']);
  const keyTerms = words
    .filter(word => word.length > 3)  // Skip short words
    .filter(word => !commonWords.has(word))  // Skip common words
    .filter(word => /^[a-z]+$/.test(word));  // Keep only alphabetic words
  
  // Return unique terms, sorted by frequency
  const termCounts = {};
  keyTerms.forEach(term => {
    termCounts[term] = (termCounts[term] || 0) + 1;
  });
  
  return Object.keys(termCounts)
    .sort((a, b) => termCounts[b] - termCounts[a])
    .slice(0, 20);  // Return top 20 terms
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      promptText, 
      primaryToggle, 
      secondaryToggle, 
      userId, 
      promptId, 
      websiteData, 
      imageData 
    } = await req.json();
    
    console.log(`Analyzing prompt: "${promptText.substring(0, 100)}${promptText.length > 100 ? '...' : ''}"\n`);
    console.log(`Primary toggle: ${primaryToggle || "None"}`);
    console.log(`Secondary toggle: ${secondaryToggle || "None"}`);
    console.log(`Has image data: ${!!imageData?.base64}`);
    console.log(`Has website data: ${!!websiteData?.url}`);
    
    // Check if we have additional context from image or website
    const hasAdditionalContext = !!(
      (imageData && imageData.base64) || 
      (websiteData && websiteData.url)
    );
    
    console.log(`Additional context detected: ${hasAdditionalContext ? "YES" : "NO"}`);
    
    // Add website content to context if provided
    let contextualData = "";
    let websiteKeywords = [];
    
    if (websiteData && websiteData.url) {
      console.log(`Website provided for context: ${websiteData.url}`);
      const websiteContent = await fetchWebsiteContent(websiteData.url);
      websiteKeywords = extractKeyTerms(websiteContent.text);
      
      contextualData += `\n\nWEBSITE CONTEXT:
URL: ${websiteData.url}
Title: ${websiteContent.title}
User Instructions: ${websiteData.instructions || "No specific instructions provided"}
Content Excerpt: ${websiteContent.text.substring(0, 3000)}...
Key Terms: ${websiteKeywords.join(', ')}
      
Please analyze this website context THOROUGHLY. Extract ALL specific concrete details like main topic, purpose, audience, tone, style, key terminology, content structure, and any other relevant information. Use these SPECIFIC extracted details to pre-fill answers to questions and variable values where the information is EXPLICITLY present in this content. ONLY pre-fill information that you can directly observe in the content.`;
    }
    
    // Add image context if provided
    let imageContext = "";
    if (imageData && imageData.base64) {
      console.log("Image provided for context - will use for pre-filling");
      imageContext = `\n\nIMAGE CONTEXT: The user has provided an image. Analyze this image THOROUGHLY and extract ALL visual details including:
- Subject(s) in the image (people, objects, landscapes)
- Viewpoint (looking up, eye-level, aerial view, etc.)
- Perspective (close-up, distance, angle, etc.)
- Setting/location/environment
- Time of day
- Season
- Weather conditions
- Lighting conditions
- Color palette
- Mood/atmosphere
- Composition
- Style
- Textures
- Any other observable details

Extract ALL these specific details and use them to pre-fill relevant answers to questions and values for variables. ONLY use information that is EXPLICITLY visible in the image.`;
    }
    
    console.log(`Additional context provided: ${hasAdditionalContext ? "Yes" : "No"}`);
    if (!hasAdditionalContext) {
      console.log("No additional context provided - ensuring answers and values remain empty");
      contextualData += "\n\nIMPORTANT: No additional context (website/image) has been provided. DO NOT pre-fill any answers or values - leave them ALL as empty strings.";
    }
    
    // Create a system message with better context about our purpose
    const systemMessage = createSystemPrompt(primaryToggle, secondaryToggle);
    
    // Get analysis from OpenAI
    const analysisResult = await analyzePromptWithAI(
      promptText, 
      systemMessage, 
      openAIApiKey, 
      contextualData + imageContext, 
      imageData?.base64
    );
    
    const analysis = analysisResult.content;
    console.log("Received analysis from OpenAI, extracting structured data...");
    
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
      const questions = extractQuestions(analysis, promptText);
      const variables = extractVariables(analysis, promptText);
      const masterCommand = extractMasterCommand(analysis);
      const enhancedPrompt = extractEnhancedPrompt(analysis);
      
      console.log(`Extracted ${questions.length} context questions relevant to AI platforms`);
      console.log(`Extracted ${variables.length} variables for customization`);
      
      // Log how many questions and variables were pre-filled
      const prefilledQuestions = questions.filter(q => q.answer && q.answer.trim() !== "").length;
      const prefilledVariables = variables.filter(v => v.value && v.value.trim() !== "").length;
      console.log(`Pre-filled answers: ${prefilledQuestions}/${questions.length} questions`);
      console.log(`Pre-filled values: ${prefilledVariables}/${variables.length} variables`);
      
      // If no additional context was provided but pre-filled values exist, log a warning
      if (!hasAdditionalContext && (prefilledQuestions > 0 || prefilledVariables > 0)) {
        console.warn("WARNING: Pre-filled values detected without additional context. Clearing pre-filled values.");
        
        // Clear any pre-filled answers when no context was provided
        questions.forEach(q => { q.answer = ""; q.isRelevant = null; });
        variables.forEach(v => { v.value = ""; v.isRelevant = null; });
      } else if (hasAdditionalContext) {
        // Ensure all pre-filled items are properly marked as relevant
        questions.forEach(q => {
          if (q.answer && q.answer.trim() !== '') {
            q.isRelevant = true;
          }
        });
        
        variables.forEach(v => {
          if (v.value && v.value.trim() !== '') {
            v.isRelevant = true;
          }
        });
        
        console.log("Extra check: Variables with pre-filled values:", 
          variables.filter(v => v.value && v.value.trim() !== '').map(v => `${v.name}: "${v.value}" (isRelevant: ${v.isRelevant})`));
      }
      
      const result = {
        questions,
        variables,
        masterCommand,
        enhancedPrompt,
        rawAnalysis: analysis,
        usage: analysisResult.usage,
        primaryToggle,
        secondaryToggle,
        hasAdditionalContext,
        contextType: imageData?.base64 ? "image" : (websiteData?.url ? "website" : "none")
      };
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (extractionError) {
      console.error("Error extracting structured data from analysis:", extractionError);
      
      // Fallback to context-specific questions based on toggles
      let contextQuestions = generateContextQuestionsForPrompt(promptText);
      
      // If we have website data, add some pre-filled answers
      if (hasAdditionalContext && websiteData && websiteData.url && websiteKeywords.length > 0) {
        contextQuestions = contextQuestions.map(q => {
          // Try to pre-fill based on website context
          if (q.text.toLowerCase().includes("topic") || q.text.toLowerCase().includes("subject")) {
            return {...q, answer: `Based on the website, the main topic appears to be related to ${websiteKeywords.slice(0, 3).join(', ')}`, isRelevant: true};
          }
          if (q.text.toLowerCase().includes("tone") || q.text.toLowerCase().includes("style")) {
            return {...q, answer: "The tone should match the website's professional presentation", isRelevant: true};
          }
          return q;
        });
      } else if (hasAdditionalContext && imageData && imageData.base64) {
        // If we have image data, we shouldn't try to pre-fill here in the fallback
        // as we don't have the analysis yet. Leave it to the client to handle.
        console.log("Image provided but extraction failed - not pre-filling in fallback");
      } else {
        // Ensure all answers are empty when no additional context is provided
        contextQuestions = contextQuestions.map(q => ({...q, answer: ""}));
      }
      
      // Filter out potentially irrelevant questions based on toggle type
      if (primaryToggle === "image") {
        contextQuestions = contextQuestions.filter(q => 
          !q.text.toLowerCase().includes("file format") && 
          !q.text.toLowerCase().includes("file type")
        );
      }
      
      let contextVariables = generateContextualVariablesForPrompt(promptText);
      
      // If we have website data, pre-fill some variables
      if (hasAdditionalContext && websiteData && websiteData.url && websiteKeywords.length > 0) {
        contextVariables = contextVariables.map(v => {
          // Try to pre-fill based on website keywords
          if (v.name.toLowerCase().includes("topic") || v.name.toLowerCase().includes("subject")) {
            return {...v, value: websiteKeywords.slice(0, 3).join(', '), isRelevant: true};
          }
          if (v.name.toLowerCase().includes("keywords")) {
            return {...v, value: websiteKeywords.slice(0, 5).join(', '), isRelevant: true};
          }
          return v;
        });
      } else {
        // Ensure all values are empty when no additional context is provided
        contextVariables = contextVariables.map(v => ({...v, value: ""}));
      }
      
      console.log("Fallback: Returning context questions with pre-filled: ", 
        contextQuestions.filter(q => q.answer && q.answer.trim() !== '').length);
      
      // Fallback to mock data but still return a 200 status code
      return new Response(JSON.stringify({
        questions: contextQuestions,
        variables: contextVariables,
        masterCommand: "Analyzed prompt: " + promptText.substring(0, 50) + "...",
        enhancedPrompt: "# Enhanced Prompt\n\n" + promptText,
        error: extractionError.message,
        rawAnalysis: analysis,
        usage: analysisResult.usage,
        primaryToggle,
        secondaryToggle,
        hasAdditionalContext,
        contextType: imageData?.base64 ? "image" : (websiteData?.url ? "website" : "none")
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Error in analyze-prompt function:", error);
    
    // Always return a 200 status code even on error, with error details in the response body
    return new Response(JSON.stringify({
      questions: generateContextQuestionsForPrompt("").map(q => ({...q, answer: ""})),
      variables: generateContextualVariablesForPrompt("").map(v => ({...v, value: ""})),
      masterCommand: "Error analyzing prompt",
      enhancedPrompt: "# Error\n\nThere was an error analyzing your prompt. Please try again.",
      error: error.message,
      primaryToggle: null,
      secondaryToggle: null,
      hasAdditionalContext: false,
      contextType: "none"
    }), {
      status: 200, // Always return a 200 to avoid edge function errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
