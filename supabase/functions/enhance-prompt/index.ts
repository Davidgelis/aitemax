
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
  math: "You are an AI specializing in enhancing math-focused prompts. The current prompt is already clear and well-structured. Please revise it only as needed to emphasize step-by-step reasoning (chain-of-thought) and a brief self-review for logical or arithmetic mistakes. Integrate any final clarifications or disclaimers that ensure accurate problem-solving, but retain the prompt's overall structure, tone, and clarity.",
  
  reasoning: "You are an AI that handles multi-layered, abstract problems. The existing prompt is strong; please refine it to ensure thorough examination of diverse angles, potential hidden assumptions, and any conflicting viewpoints. Integrate a methodical breakdown of complex concepts referencing known logical frameworks, while preserving the prompt's original tone and focus.",
  
  coding: "You are an AI with expertise in optimizing coding prompts. The original prompt is already thorough. Please revise it slightly to confirm the target language and environment, include a brief instruction for testing and debugging in an iterative loop, and encourage a quick self-audit of the code for syntax or logical issues. Maintain the rest of the prompt's structure, focusing only on these fine-tuning elements.",
  
  copilot: "You are an AI that adapts prompts to a continuous, \"copilot-style\" context. The existing prompt is nearly perfect; simply adjust it to encourage iterative back-and-forth steps rather than a one-off answer, add a note about tracking updates or changes as a \"memory,\" and invite the user (or the AI) to refine each answer at least once for a truly collaborative workflow. Keep the original prompt's strong structure and coherence intact, adding only these new copilot elements.",
  
  token: "You are an AI that revises prompts to prioritize token efficiency and minimize computational cost based on the four strategic pillars. From the Master Prompt just created, produce a refined version that generates concise, direct responses without unnecessary detail or verbosity. Ensure code snippets remain minimal and optimized, using compressed formats (like bullet points or short paragraphs) wherever possible. Limit disclaimers, self-references, or hedging language unless strictly required. Dynamically adjust reasoning depth to the importance of the query, avoiding lengthy step-by-step explanations if a direct answer suffices. For multiple-choice or list-based tasks, group responses to prevent excessive token generation. The final output should balance completeness, accuracy, and cost-effectiveness, leveraging pre-trained knowledge over verbose reasoning while preserving clarity and correctness.",
  
  strict: "You are an AI that specializes in enforcing precise formats. The prompt you're about to revise is already excellent, so only make minimal changes to explicitly reinforce the required output format, instruct the AI to verify that it hasn't broken the specified structure, and, if appropriate, provide a simple example illustrating correct formatting. Do not alter the prompt's main content or style; just ensure strict-formatting instructions are crystal clear.",
  
  creative: "You are an AI that refines prompts for creative writing or ideation. The original prompt is already strong; simply tweak it to emphasize variety in tone or style, possibly request multiple viewpoints or drafts, and invite a short self-review for consistency, plot holes, or stylistic mismatches. Retain the core creative direction while adding these gentle enhancements to ensure the final output can engage diverse audiences and maintain narrative coherence.",
  
  image: "You are an AI that refines prompts for generating images. The existing prompt is already solid; please make minimal adjustments to specify the desired visual style or medium, clarify necessary resolution or aspect ratio, and note any disclaimers for sensitive or copyrighted content. Keep the overall structure intact, focusing solely on these new image-related details."
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
    
    console.log(`Enhancing prompt with GPT-4o analysis...`);
    console.log(`Original prompt: "${originalPrompt.substring(0, 100)}..."`);
    console.log(`Questions answered: ${answeredQuestions.length}`);
    console.log(`Relevant variables: ${relevantVariables.length}`);
    console.log(`Primary toggle: ${primaryToggle || "None"}`);
    console.log(`Secondary toggle: ${secondaryToggle || "None"}`);
    
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
    
    // Build the system message with the template provided
    // Emphasizing that the original prompt should be the primary reference
    const systemMessage = {
      role: 'system',
      content: `
      "Task": "You will be provided with the user's original prompt, which should be your PRIMARY REFERENCE and MAIN FOUNDATION. DO NOT COMPLETELY REWRITE IT. Instead, enhance and refine it while PRESERVING ITS CORE STRUCTURE AND INTENT. You'll also receive context questions with answers and relevant variables to help inform your enhancement.

Your job is to build an enhanced prompt by STARTING WITH THE ORIGINAL and applying targeted improvements. The original prompt's structure, style, and instructions should be clearly recognizable in your output.

IMPORTANT: The original prompt is the starting point for your enhancement. Treat it as the core foundation that you're refining and improving, not replacing.

Expected Final Output: The enhanced prompt should maintain the user's original intent, core instructions, and structure while incorporating refinements based on the context. The final prompt must be organized into the four pillars: Task, Persona, Conditions, and Instructions.",

      "Persona": "Assume the role of an advanced prompt enhancer with expertise in language, prompt engineering, and multi-perspective analysis. You recognize the importance of preserving the user's original intent while making enhancements. You take a surgical and precise approach to enhancement rather than rewriting.",
      
      "Conditions": "When enhancing the prompt, adhere to these comprehensive guidelines:

1. PRESERVATION OF ORIGINAL INTENT - This is the most important guideline. Preserve the user's original instructions, core requirements, and intent.

2. Structure-Oriented - Maintain or improve the logical sequence and organization.

3. Context Integration - Incorporate the provided context questions and variables only where they add value and enhance the original intent.

4. Highlighting Incomplete Information - Identify any hallucinated or missing context and leave clearly labeled placeholders (e.g., \"[Context Needed]\") for the user to fill in specifics.

5. Terminology & Definitions - Define ambiguous terms to avoid misinterpretation.

6. Notes for Extra Clarifications - Append a \"Notes\" section at the end of every prompt to include additional clarifications or commentaries.",

      "Instructions": "Follow these step-by-step guidelines to enhance the input prompt:

1. Analyze the Original Prompt:
   - Understand the user's original intent, structure, and key requirements.
   - Identify areas that could benefit from clarification or enhancement.

2. Integrate Context:
   - Use the answers to context questions and relevant variables to enhance the prompt.
   - Only add information that aligns with and supports the original intent.

3. Apply Targeted Enhancements:
   - Make precise, surgical enhancements rather than wholesale rewrites.
   - Ensure the enhanced version is clearly recognizable as derived from the original.

4. Maintain the Four Pillars Structure:
   - Organize the final prompt into the four pillars: Task, Persona, Conditions, and Instructions.
   - Ensure each pillar builds upon and refines the corresponding elements in the original prompt.

5. Add a Title and Notes:
   - Create a concise title (5 words or less) that captures the original intent.
   - Include a brief notes section for any additional clarifications if needed."
      
      ADDITIONALLY, come up with a short, concise title (5 words or less) that captures the essence of the prompt. The title should be innovative and suitable for the prompt's purpose. Place this title at the very beginning of your response, before the Task section, formatted as "**[TITLE]**".
      
      ${primaryPrompt ? `\n\nPRIMARY TOGGLE INSTRUCTION: ${primaryPrompt}` : ""}
      ${secondaryPrompt ? `\n\nSECONDARY TOGGLE INSTRUCTION: ${secondaryPrompt}` : ""}
      
      FINAL REMINDER: The user's original prompt should be clearly recognizable in your enhancement. You are refining and improving it, not replacing it.
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
    // Emphasizing that the original prompt should be preserved
    const userMessage = {
      role: 'user',
      content: `
Please enhance the following prompt while PRESERVING ITS CORE STRUCTURE AND INTENT. The original prompt is your primary reference and foundation.

ORIGINAL PROMPT (THIS IS YOUR MAIN FOUNDATION - DO NOT COMPLETELY REWRITE):
${originalPrompt}

CONTEXT QUESTIONS AND ANSWERS:
${formattedQuestions}

VARIABLES:
${formattedVariables}

PRIMARY TOGGLE: ${primaryToggle || "None"}
SECONDARY TOGGLE: ${secondaryToggle || "None"}

Based on this information, enhance the original prompt. The enhanced prompt should be CLEARLY RECOGNIZABLE as derived from the original, with targeted improvements incorporated. Follow the structure of Task, Persona, Conditions, and Instructions.
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
