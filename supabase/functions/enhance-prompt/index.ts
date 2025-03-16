
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to calculate token costs - UPDATED WITH NEW PRICING
function calculateTokenCosts(promptTokens: number, completionTokens: number) {
  // GPT-4o pricing: $0.0025 per 1K prompt tokens, $0.01 per 1K completion tokens
  const promptCost = (promptTokens / 1000) * 0.0025;
  const completionCost = (completionTokens / 1000) * 0.01;
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

// Function to retry the OpenAI API call with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  let lastError;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1} to call OpenAI API...`);
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      const errorText = await response.text();
      console.error(`Error response (${response.status}):`, errorText);
      
      if (response.status === 401) {
        // Authentication error - no need to retry
        throw new Error(`Authentication error: ${errorText}`);
      }
      
      lastError = new Error(`Request failed with status ${response.status}: ${errorText}`);
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      lastError = error;
    }
    
    retryCount++;
    if (retryCount < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s, etc.
      const backoffMs = 1000 * Math.pow(2, retryCount - 1);
      console.log(`Retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  throw lastError;
}

// Toggle prompts map
const togglePrompts = {
  math: "You are an AI specializing in enhancing math-focused prompts. The current prompt is already clear and well-structured. Please revise it only as needed to emphasize step-by-step reasoning (chain-of-thought) and a brief self-review for logical or arithmetic mistakes. Integrate any final clarifications or disclaimers that ensure accurate problem-solving, but retain the prompt's overall structure, tone, and clarity.",
  
  reasoning: "You are an AI that handles multi-layered, abstract problems. The existing prompt is strong; please refine it to ensure thorough examination of diverse angles, potential hidden assumptions, and any conflicting viewpoints. Integrate a methodical breakdown of complex concepts referencing known logical frameworks, while preserving the prompt's original tone and focus.",
  
  coding: "You are an AI with expertise in optimizing coding prompts. The original prompt is already thorough. Please revise it slightly to confirm the target language and environment, include a brief instruction for testing and debugging in an iterative loop, and encourage a quick self-audit of the code for syntax or logical issues. Maintain the rest of the prompt's structure, focusing only on these fine-tuning elements.",
  
  copilot: "You are an AI that adapts prompts to a continuous, \"copilot-style\" context. The existing prompt is nearly perfect; simply adjust it to encourage iterative back-and-forth steps rather than a one-off answer, add a note about tracking updates or changes as a \"memory,\" and invite the user (or the AI) to refine each answer at least once for a truly collaborative workflow. Keep the original prompt's strong structure and coherence intact, adding only these new copilot elements.",
  
  token: "You are an AI that revises prompts to prioritize token efficiency and minimize computational cost based on the four strategic pillars. From the Master Prompt just created, produce a refined version that generates concise, direct responses without unnecessary detail or verbosity. Ensure code snippets remain minimal and optimized, using compressed formats (like bullet points or short paragraphs) wherever possible. Limit disclaimers, self-references, or hedging language unless strictly required. Dynamically adjust reasoning depth to the importance of the query, avoiding lengthy step-by-step explanations if a direct answer suffices. For multiple-choice or list-based tasks, group responses to prevent excessive token generation. The final output should balance completeness, accuracy, and cost-effectiveness, leveraging pre-trained knowledge over verbose reasoning while preserving clarity and correctness.",
  
  strict: "You are an AI that specializes in enforcing precise formats. The prompt you're about to revise is already excellent, so only make minimal changes to explicitly reinforce the required output format, instruct the AI to verify that it hasn't broken the specified structure, and, if appropriate, provide a simple example illustrating correct formatting. Do not alter the prompt's main content or style; just ensure strict-formatting instructions are crystal clear.",
  
  creative: "You are an AI that refines prompts for creative writing or ideation. The original prompt is already strong; simply tweak it to emphasize variety in tone or style, possibly request multiple viewpoints or drafts, and invite a short self-review for consistency, plot holes, or stylistic mismatches. Retain the core creative direction while adding these gentle enhancements to ensure the final output can engage diverse audiences and maintain narrative coherence.",
  
  image: "You are an AI that refines prompts for generating images. The existing prompt is already solid; please make minimal adjustments to specify the desired visual style or medium, clarify necessary resolution or aspect ratio, and note any compositional elements that would make the image more coherent and visually striking. Focus on artistic direction rather than technical specs that most AI image generators handle automatically. Keep the overall structure intact, focusing solely on enhancing the creative visual elements."
};

// Toggle labels map for loading message
const toggleLabels = {
  math: "Mathematical Problem-Solving",
  reasoning: "Complex Reasoning",
  coding: "Coding",
  copilot: "Copilot",
  token: "Token Saver",
  strict: "Strict Response",
  creative: "Creative",
  image: "Image Creating"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request data
    const { 
      originalPrompt, 
      answeredQuestions, 
      relevantVariables,
      primaryToggle,
      secondaryToggle,
      userId,
      promptId
    } = await req.json();
    
    console.log(`Enhancing prompt with o3-mini-2025-01-31 analysis...`);
    console.log(`Original prompt: "${originalPrompt.substring(0, 100)}..."`);
    console.log(`Questions answered: ${answeredQuestions.length}`);
    console.log(`Relevant variables: ${relevantVariables.length}`);
    console.log(`Primary toggle: ${primaryToggle || "None"}`);
    console.log(`Secondary toggle: ${secondaryToggle || "None"}`);
    console.log(`Enhancing for use on AI platforms with appropriate context`);
    
    // Validate OpenAI API key
    if (!openAIApiKey) {
      console.error("OpenAI API key is missing");
      throw new Error("OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.");
    }
    
    // Get toggle prompts if applicable
    const primaryPrompt = primaryToggle ? togglePrompts[primaryToggle] : "";
    const secondaryPrompt = secondaryToggle ? togglePrompts[secondaryToggle] : "";
    
    // Create loading message based on toggles
    let loadingMessage = "Enhancing your prompt";
    if (primaryToggle) {
      loadingMessage += ` for ${toggleLabels[primaryToggle]}`;
      if (secondaryToggle) {
        loadingMessage += ` and to be ${toggleLabels[secondaryToggle]}`;
      }
    } else if (secondaryToggle) {
      loadingMessage += ` to be ${toggleLabels[secondaryToggle]}`;
    }
    loadingMessage += "...";
    
    // Build the system message with the template provided but with more flexibility
    const systemMessage = {
      role: 'system',
      content: `
      You are an advanced prompt enhancement specialist. Your task is to transform input prompts into well-structured, effective prompts for AI systems by applying best practices and instructions.

      CORE STRUCTURE REQUIREMENTS:
      The final prompt should incorporate the four key pillars: Task, Persona, Conditions, and Instructions. While you should maintain this general structure, you have creative freedom to optimize the prompt as you see fit. Your goal is to produce the most effective prompt possible.

      PERSONA SECTION GUIDELINES:
      - Establish a clear, appropriate persona for the AI that aligns with the user's goals
      - When multiple perspectives are required, ensure each persona has a distinct focus but interacts dynamically with others
      - Use third-person pronouns and a formal executive tone when appropriate
      - Ensure mutual acknowledgment between different personas, with each building upon the ideas of others
      - Use clear section labels when presenting different viewpoints
      - End with a concise summation of key agreements and unresolved issues
      - Keep each persona's reasoning logically coherent

      TASK SECTION GUIDELINES:
      - Clearly communicate the main objective with conciseness and clarity
      - Preserve the original intent while enhancing structure and clarity
      - Specify the expected output format or deliverable
      - Maintain consistency in tone and style throughout

      CONDITIONS SECTION GUIDELINES:
      - Organize content logically with clear structure
      - Use specific formats or templates when required
      - Provide abstract examples to illustrate concepts
      - Break down content into logical categories
      - Validate interpretations against multiple data points
      - Consider context and contradictions in language
      - Avoid relying solely on typical patterns that might ignore exceptions
      - Highlight incomplete information with placeholders if needed
      - Identify definitive data that must remain unchanged
      - Clarify ambiguous terms to prevent misinterpretation
      - Include sample outputs when helpful
      - Add notes for additional clarification if needed
      - Present information in appropriate sequential or hierarchical order

      INSTRUCTIONS SECTION GUIDELINES:
      - Provide a step-by-step approach to accomplishing the task
      - Begin with a brief overview of the strategy
      - Analyze inputs and identify areas needing special attention
      - Combine insights into a cohesive structure
      - Ensure the final instructions are clear and actionable
      - Include optional clarifications or examples when helpful

      VARIABLE HANDLING:
      - Incorporate all provided variables appropriately within the relevant sections
      - Do not remove or rename variables
      - Place variables where they maintain logical flow

      IMPORTANT: While you should respect these guidelines, you have the freedom to adapt and optimize the prompt to best serve its purpose. Focus on creating a prompt that will produce the most effective results when used with AI systems.
      
      REMEMBER that this prompt will be used on an AI platform, so ensure it follows best practices for AI-to-AI communication and avoids asking for capabilities or formats that are standardized or fixed in AI systems.
      
      ${primaryPrompt ? `\n\nPRIMARY TOGGLE INSTRUCTION: ${primaryPrompt}` : ""}
      ${secondaryPrompt ? `\n\nSECONDARY TOGGLE INSTRUCTION: ${secondaryPrompt}` : ""}

      Come up with a short, concise title (5 words or less) that captures the essence of the prompt. The title should be innovative and suitable for the prompt's purpose. Place this title at the very beginning of your response, before the Task section, formatted as "**[TITLE]**".
      `
    };

    // Format questions and variables into a clear structure for GPT
    const formattedQuestions = answeredQuestions.map(q => 
      `- Question: ${q.text}\n  Answer: ${q.answer}\n  Category: ${q.category}\n  Relevant: ${q.isRelevant ? "Yes" : "No"}`
    ).join('\n\n');

    const formattedVariables = relevantVariables.map(v => 
      `- Variable Name: ${v.name}\n  Value: ${v.value}\n  Category: ${v.category || "Uncategorized"}`
    ).join('\n\n');

    // Create user message with structured input data
    const userMessage = {
      role: 'user',
      content: `
Please analyze and enhance the following prompt based on the provided context. This prompt will be used on an AI platform, so make it optimized for AI-to-AI communication.

ORIGINAL PROMPT:
${originalPrompt}

CONTEXT QUESTIONS AND ANSWERS:
${formattedQuestions}

VARIABLES:
${formattedVariables}

PRIMARY TOGGLE: ${primaryToggle || "None"}
SECONDARY TOGGLE: ${secondaryToggle || "None"}

Based on this information, generate an enhanced final prompt that follows the structure of Task, Persona, Conditions, and Instructions while incorporating all necessary variables and maintaining the original intent. You have creative freedom to structure the prompt in the most effective way possible while adhering to the general framework.
      `
    };

    try {
      console.log("Calling OpenAI API with o3-mini-2025-01-31 model and o3-preview header...");
      
      // Call the OpenAI API with retry capability and the required Beta header
      const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'o3-preview' // IMPORTANT: Required header for o3 models
        },
        body: JSON.stringify({
          model: 'o3-mini-2025-01-31', // Using the correct full model name with version
          messages: [systemMessage, userMessage],
          temperature: 0.7,
        }),
      });
      
      const data = await response.json();
      
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Invalid response from OpenAI API:", JSON.stringify(data));
        throw new Error("Invalid response format from OpenAI API");
      }
      
      const enhancedPrompt = data.choices[0].message.content;
      
      console.log("Prompt enhancement completed successfully with o3-mini-2025-01-31");
      
      // Record the token usage for this step if userId is provided
      if (userId) {
        await recordTokenUsage(
          userId,
          promptId,
          3, // Step 3: Final prompt generation
          data.usage.prompt_tokens,
          data.usage.completion_tokens,
          'o3-mini-2025-01-31'
        );
      }
      
      return new Response(JSON.stringify({ 
        enhancedPrompt,
        loadingMessage,
        usage: data.usage
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openaiError) {
      console.error("Error calling OpenAI API:", openaiError);
      console.error("Error details:", openaiError.stack || "No stack trace available");
      
      // Create a fallback enhanced prompt
      const fallbackPrompt = `# Enhanced Prompt (Fallback)

## Task
${originalPrompt}

## Persona
An AI assistant that provides helpful, accurate, and thoughtful responses.

## Conditions
- Respond based on the given context and information
- Consider all relevant factors mentioned in the prompt
- Maintain a balanced and objective perspective

## Instructions
- Address all aspects of the query
- Provide clear and structured information
- Use examples where appropriate
- Ensure the response is complete and addresses the core needs
`;
      
      return new Response(JSON.stringify({
        enhancedPrompt: fallbackPrompt,
        loadingMessage: "Error enhancing prompt, using fallback format...",
        error: openaiError.message
      }), {
        status: 200, // Always return 200 to avoid edge function error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Error in enhance-prompt function:", error);
    console.error("Stack trace:", error.stack || "No stack trace available");
    
    return new Response(JSON.stringify({
      error: error.message,
      enhancedPrompt: "# Error Enhancing Prompt\n\nThere was an error analyzing your inputs. Please try again or adjust your inputs.",
      loadingMessage: "Error enhancing prompt..."
    }), {
      status: 200, // Always return 200 to avoid edge function error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
