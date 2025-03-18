import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { xhr } from "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAI } from "https://esm.sh/openai@4.26.0";

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

// Toggle prompts map
const togglePrompts = {
  video: "You are an AI that refines prompts for video production. The prompt is strong, so only introduce minimal changes to specify the desired format or style (e.g., live action, animation), include clear length or resolution guidelines, and address key editing or post-production requirements. Retain the original focus and structure while adding these essential video-related details.",
  
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
  video: "Video Creation",
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
    
    console.log(`Enhancing prompt with o3-mini analysis...`);
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
    
    // Build the system message with the updated four-pillar structure requirements
    const systemMessage = `
      You are an advanced prompt enhancement specialist. Your task is to transform input prompts into well-structured, effective prompts for AI systems by applying best practices and instructions.

      CORE STRUCTURE REQUIREMENTS:
      The final prompt MUST follow the four-pillar structure exactly in this order:
      1. Task
      2. Persona
      3. Conditions
      4. Instructions

      IMPORTANT FORMATTING RULES:
      - Start with a SHORT TITLE (3-5 words) in plain text with NO asterisks, markdown formatting, or other special formatting
      - Use clear section headers for each pillar (Task, Persona, Conditions, Instructions)
      - Format section headers consistently throughout the document

      PERSONA SECTION GUIDELINES:
      - Establish appropriate personas that align with the user's goals
      - Each persona should have a distinct focus but interact dynamically with others
      - Use third-person pronouns and formal executive tone
      - Ensure mutual acknowledgment between different perspectives
      - Use clear section labels when presenting different viewpoints
      - End with a concise summation of key agreements and unresolved issues

      TASK SECTION GUIDELINES:
      - Clearly communicate the main objective with conciseness and clarity
      - Preserve the original intent while enhancing structure
      - Specify the expected output format or deliverable
      - Maintain consistency in tone and style throughout

      CONDITIONS SECTION GUIDELINES:
      - Organize content logically with clear structure
      - Use specific formats or templates when required
      - Break down content into logical categories
      - Validate interpretations against multiple data points
      - Consider context and contradictions in language
      - Identify definitive data that must remain unchanged
      - Clarify ambiguous terms to prevent misinterpretation

      INSTRUCTIONS SECTION GUIDELINES:
      - Provide a step-by-step approach to accomplishing the task
      - Begin with a brief overview of the strategy
      - Analyze inputs and identify areas needing special attention
      - Combine insights into a cohesive structure
      - Ensure the final instructions are clear and actionable

      VARIABLE HANDLING:
      - Incorporate all provided variables appropriately within the relevant sections
      - Do not remove or rename variables
      - Place variables where they maintain logical flow

      FINAL OUTPUT REQUIREMENTS:
      - The enhanced prompt must be structured for consumption by another AI system
      - Ensure the content is clear, concise, and ready to be executed without additional clarification
      - The prompt should function effectively as a standalone instruction set
      - IMPORTANT: The title MUST be plain text with NO markdown formatting (no asterisks, no bold)
      ${primaryPrompt ? `\n\nPRIMARY TOGGLE INSTRUCTION: ${primaryPrompt}` : ""}${secondaryPrompt ? `\n\nSECONDARY TOGGLE INSTRUCTION: ${secondaryPrompt}` : ""}
      `;

    // Format questions and variables into a clear structure for GPT
    const formattedQuestions = answeredQuestions.map(q => 
      `- Question: ${q.text}\n  Answer: ${q.answer}\n  Category: ${q.category}\n  Relevant: ${q.isRelevant ? "Yes" : "No"}`
    ).join('\n\n');

    const formattedVariables = relevantVariables.map(v => 
      `- Variable Name: ${v.name}\n  Value: ${v.value}\n  Category: ${v.category || "Uncategorized"}`
    ).join('\n\n');

    // Create user message with structured input data
    const userMessage = `
Please analyze and enhance the following prompt based on the provided context. This prompt will be used by another AI system, so it needs to follow the four-pillar structure exactly.

ORIGINAL PROMPT:
${originalPrompt}

CONTEXT QUESTIONS AND ANSWERS:
${formattedQuestions}

VARIABLES:
${formattedVariables}

PRIMARY TOGGLE: ${primaryToggle || "None"}
SECONDARY TOGGLE: ${secondaryToggle || "None"}

Based on this information, generate an enhanced final prompt that follows the structure of Task, Persona, Conditions, and Instructions while incorporating all necessary variables and maintaining the original intent. Remember to start with a plain text title (no asterisks, no bold or other markdown formatting) and use clear section headers for each pillar.
    `;

    try {
      console.log("Using modern OpenAI client with o3-mini model...");
      
      // Initialize the OpenAI client
      const openai = new OpenAI({
        apiKey: openAIApiKey
      });
      
      // Prepare the message structure
      const messages = [
        { role: "assistant", content: systemMessage },
        { role: "user", content: userMessage }
      ];
      
      // Make the API call using the modern OpenAI client
      const completion = await openai.chat.completions.create({
        model: "o3-mini",
        messages: messages,
        reasoning_effort: "high", // Using high reasoning effort
      });
      
      // Extract the enhanced prompt from the response
      const enhancedPrompt = completion.choices[0].message.content;
      
      console.log("Prompt enhancement completed successfully with o3-mini");
      
      // Estimate token usage for reporting (exact counts may not be available)
      const estimatedUsage = {
        prompt_tokens: Math.ceil((systemMessage.length + userMessage.length) / 4),
        completion_tokens: Math.ceil(enhancedPrompt.length / 4),
        total_tokens: Math.ceil((systemMessage.length + userMessage.length + enhancedPrompt.length) / 4)
      };
      
      // Record the token usage for this step if userId is provided - FIRE AND FORGET PATTERN
      if (userId) {
        recordTokenUsage(
          userId,
          promptId,
          3, // Step 3: Final prompt generation
          estimatedUsage.prompt_tokens,
          estimatedUsage.completion_tokens,
          'o3-mini'
        ).catch((err) => console.error("Token usage recording failed:", err));
      }
      
      return new Response(JSON.stringify({ 
        enhancedPrompt,
        loadingMessage,
        usage: estimatedUsage
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openaiError) {
      console.error("Error calling OpenAI API:", openaiError);
      console.error("Error details:", openaiError.stack || "No stack trace available");
      console.error("Error response:", JSON.stringify(openaiError.response || {}));
      
      // Attempt with lower reasoning effort if high effort failed
      try {
        console.log("Retrying with medium reasoning effort...");
        
        const openai = new OpenAI({
          apiKey: openAIApiKey
        });
        
        const completion = await openai.chat.completions.create({
          model: "o3-mini",
          messages: [
            { role: "assistant", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          reasoning_effort: "medium",
        });
        
        const enhancedPrompt = completion.choices[0].message.content;
        
        console.log("Prompt enhancement completed successfully with medium reasoning effort");
        
        return new Response(JSON.stringify({ 
          enhancedPrompt,
          loadingMessage,
          usage: {
            prompt_tokens: Math.ceil((systemMessage.length + userMessage.length) / 4),
            completion_tokens: Math.ceil(enhancedPrompt.length / 4)
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (retryError) {
        console.error("Error on retry attempt:", retryError);
        
        // Create a fallback enhanced prompt that follows the four-pillar structure
        const fallbackPrompt = `Prompt Enhancement

Task
${originalPrompt}

Persona
An AI assistant that provides helpful, accurate, and thoughtful responses tailored to the specific needs outlined in the prompt.

Conditions
- Address all aspects of the query based on the given context
- Consider all relevant factors mentioned in the prompt
- Maintain a balanced and objective perspective
- Follow any specific formatting or structure requirements

Instructions
- Begin by analyzing the key requirements and objectives
- Break down complex concepts into manageable components
- Provide clear and structured information with examples where appropriate
- Conclude with actionable insights that address the core needs
`;
        
        return new Response(JSON.stringify({
          enhancedPrompt: fallbackPrompt,
          loadingMessage: "Error enhancing prompt, using fallback format...",
          error: retryError.message
        }), {
          status: 200, // Always return 200 to avoid edge function error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (error) {
    console.error("Error in enhance-prompt function:", error);
    console.error("Stack trace:", error.stack || "No stack trace available");
    
    // Return a generic fallback that follows the four-pillar structure
    return new Response(JSON.stringify({
      error: error.message,
      enhancedPrompt: `Prompt Generator

Task
Transform the original input into a clear, structured prompt.

Persona
A prompt engineering specialist focused on creating effective AI instructions.

Conditions
- Maintain the original intent and purpose
- Structure content logically and coherently
- Use formal, professional language throughout

Instructions
- Analyze the core requirements of the original text
- Organize information into a clear framework
- Ensure all critical elements are preserved
- Present the final prompt in a format optimized for AI processing
`,
      loadingMessage: "Error enhancing prompt..."
    }), {
      status: 200, // Always return 200 to avoid edge function error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
