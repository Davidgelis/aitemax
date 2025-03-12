
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    
    console.log(`Enhancing prompt with GPT-4o analysis...`);
    console.log(`Original prompt: "${originalPrompt.substring(0, 100)}..."`);
    console.log(`Questions answered: ${answeredQuestions.length}`);
    console.log(`Relevant variables: ${relevantVariables.length}`);
    console.log(`Primary toggle: ${primaryToggle || "None"}`);
    console.log(`Secondary toggle: ${secondaryToggle || "None"}`);
    console.log(`Enhancing for use on AI platforms with appropriate context`);
    
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
    
    // Updated system message with detailed pillar guidance
    const systemMessage = {
      role: 'system',
      content: `
      You are tasked with enhancing and reformatting a user's prompt into a more effective structure. While you have creative freedom in your approach, your output MUST follow these four essential pillars:

      1. PERSONA SECTION:
      - Adopt the role of an advanced scenario generator that simulates multiple professional perspectives, aligned with the user's specific context and goals.
      - Create distinct persona definitions with each having a unique focus (e.g., Product Manager, UX Researcher, and Engineering Lead for product design, or Financial Analyst, Risk Officer, Investment Strategist for finance).
      - Present each persona's viewpoint in clearly labeled sections using third-person pronouns ("he," "she," "they") and formal language without contractions.
      - Ensure personas interact dynamically, directly addressing and building upon each other's points, highlighting both agreements and disagreements.
      - Conclude with a concise summary highlighting consensus and unresolved issues.
      - Keep each persona's reasoning logically focused on their domain while ensuring the final synthesis is cohesive.
      - This section should appear first in the final prompt structure to establish viewpoints before addressing the main task.

      2. TASK SECTION:
      - Clearly communicate the main objective with conciseness and clarity.
      - Keep directives succinct but unambiguous, emphasizing the transformation as the central goal.
      - Preserve the original intent and meaning while refining grammar and structure.
      - Specify that the final output must include all four pillars (Persona, Task, Conditions, Instructions).
      - Maintain a neutral, professional tone throughout, consistent with formal brand voice.

      3. CONDITIONS SECTION:
      - Provide detailed guidelines for methodology with structure-oriented organization.
      - Ensure logical content flow and clear layout from point to point.
      - Use abstract examples rather than specific data to illustrate concepts.
      - Break content into logical categories or sections for better readability.
      - Include cross-checking mechanisms using multiple data points to validate interpretations.
      - Maintain context awareness when assessing meanings, avoiding purely keyword-based judgments.
      - Highlight incomplete information with placeholders if needed (e.g., "[Context Needed]").
      - Identify data that must remain unchanged or is undeniably correct.
      - Clarify ambiguous terms to prevent misinterpretation.
      - For projects or events, present information in sequential or hierarchical order, respecting dependencies.
      - Consider adding a Notes section for additional clarifications if needed.

      4. INSTRUCTIONS SECTION:
      - Provide step-by-step guidance for implementing the prompt.
      - Begin with a brief overview of the approach to revision.
      - Include analysis of the input, identifying key points and areas needing improvement.
      - Detail the synthesis and organization process to combine insights into a cohesive new prompt.
      - Outline the finalization process for presenting the polished, fully revised prompt.
      - Add a notes section for optional clarifications or advanced instructions not covered elsewhere.

      IMPORTANT: Create a short, innovative title (5 words or less) that captures the prompt's essence. Format it as "**[TITLE]**" at the beginning of your response.

      ADDITIONAL REQUIREMENTS:
      - Include ALL identified variables appropriately placed within the relevant sections - don't remove or rename any variables.
      - The final prompt should be optimized for AI-to-AI communication while maintaining the four-pillar structure.
      - You have creative freedom to make the prompt as effective as possible while adhering to these guidelines.

      ${primaryPrompt ? `\n\nPRIMARY TOGGLE INSTRUCTION: ${primaryPrompt}` : ""}
      ${secondaryPrompt ? `\n\nSECONDARY TOGGLE INSTRUCTION: ${secondaryPrompt}` : ""}
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

Based on this information, generate an enhanced final prompt that follows the structure of Persona, Task, Conditions, and Instructions. You have creative freedom to make this prompt as effective as possible while maintaining these four sections and including all relevant variables.
      `
    };

    // Call GPT-4o API to enhance the prompt - explicitly using GPT-4o model
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Explicitly use GPT-4o
        messages: [systemMessage, userMessage],
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API responded with status ${response.status}: ${errorData}`);
    }
    
    const data = await response.json();
    const enhancedPrompt = data.choices[0].message.content;
    
    console.log("Prompt enhancement completed successfully with GPT-4o");
    
    // Record the token usage for this step if userId is provided
    if (userId) {
      await recordTokenUsage(
        userId,
        promptId,
        3, // Step 3: Final prompt generation
        data.usage.prompt_tokens,
        data.usage.completion_tokens,
        'gpt-4o'
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
  } catch (error) {
    console.error("Error in enhance-prompt function:", error);
    
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
