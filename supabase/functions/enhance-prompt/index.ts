
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAI } from "https://esm.sh/openai@4.26.0";

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
    const { 
      originalPrompt, 
      answeredQuestions, 
      relevantVariables,
      primaryToggle,
      secondaryToggle,
      userId,
      promptId
    } = await req.json();
    
    console.log(`Enhancing prompt with focus on ${primaryToggle || "no specific toggle"}`);
    console.log(`Original prompt: "${originalPrompt.substring(0, 100)}..."`);
    
    // Build the system message
    const systemMessage = `You are an expert prompt engineer that transforms input prompts into highly effective, well-structured prompts following specific guidelines.

CORE PRINCIPLES:
1. Focus on creating a natural, flowing prompt that incorporates all key elements
2. Structure the output to clearly address all four pillars (Persona, Task, Conditions, Instructions)
3. Maintain the original intent while improving clarity and effectiveness
4. Begin with personas to establish perspectives, then build the rest of the prompt

PERSONA GUIDELINES:
- Define distinct personas aligned with the prompt's purpose
- Use third-person pronouns and formal executive tone
- Ensure personas interact and acknowledge each other's points
- End with a concise summation of agreements and open issues

TASK GUIDELINES:
- Keep directives clear and unambiguous
- Preserve the original intent while enhancing structure
- Maintain consistent tone throughout

CONDITIONS GUIDELINES:
- Organize content logically with clear structure
- Use specific formats or templates when required
- Break down content into logical categories
- Cross-validate interpretations
- Consider context and contradictions
- Identify definitive data
- Clarify ambiguous terms

INSTRUCTIONS GUIDELINES:
- Provide a step-by-step approach
- Begin with strategy overview
- Analyze inputs and identify areas needing attention
- Combine insights into cohesive structure
- Ensure final instructions are clear and actionable

OUTPUT FORMAT:
Your enhanced prompt must flow naturally while incorporating all necessary elements. Structure it with clear sections but avoid rigid formatting that could impede understanding.
${primaryToggle ? `\n\nPRIMARY FOCUS: ${primaryToggle}` : ""}${secondaryToggle ? `\nSECONDARY FOCUS: ${secondaryToggle}` : ""}`;

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openAIApiKey
    });

    // Prepare context from answered questions
    const context = answeredQuestions
      .filter(q => q.answer && q.answer.trim() !== "")
      .map(q => `${q.text}\nAnswer: ${q.answer}`).join("\n\n");

    // Create the prompt for GPT
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `Transform this prompt into an enhanced version following our guidelines:

ORIGINAL PROMPT:
${originalPrompt}

CONTEXT FROM USER:
${context}

Create an enhanced prompt that follows our guidelines for the four pillars (Persona, Task, Conditions, Instructions) while maintaining natural flow and clarity. Focus especially on creating distinct personas that will interact throughout the prompt.` }
    ];

    try {
      // Make the API call
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7
      });

      const enhancedPrompt = completion.choices[0].message.content;
      
      return new Response(JSON.stringify({ 
        enhancedPrompt,
        loadingMessage: `Enhancing prompt${primaryToggle ? ` for ${primaryToggle}` : ''}...`,
        usage: completion.usage || { prompt_tokens: 0, completion_tokens: 0 }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openaiError) {
      console.error("Error calling OpenAI API:", openaiError);
      
      // Return a structured error response
      return new Response(JSON.stringify({
        error: openaiError.message,
        enhancedPrompt: `# Error Enhancing Prompt

We encountered an error while trying to enhance your prompt. Please try again.

Original Prompt:
${originalPrompt}`,
        loadingMessage: "Error enhancing prompt..."
      }), {
        status: 200, // Keep 200 to avoid edge function errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Error in enhance-prompt function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      enhancedPrompt: "Error: Could not process the prompt enhancement request.",
      loadingMessage: "Error processing request..." 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
