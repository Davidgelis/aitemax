
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAI } from "https://esm.sh/openai@4.26.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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
      templateId,
      userId,
      promptId
    } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (templateError) {
      throw new Error(`Template not found: ${templateError.message}`);
    }
    
    console.log(`Enhancing prompt with template: ${template.title}`);
    console.log(`Original prompt: "${originalPrompt.substring(0, 100)}..."`);
    
    // Prepare the context from answered questions
    const context = answeredQuestions
      .filter(q => q.answer && q.answer.trim() !== "")
      .map(q => `${q.text}\nAnswer: ${q.answer}`).join("\n\n");
    
    // Build the system message
    let systemMessage = template.system_prefix || 'You are an expert prompt engineer that transforms input prompts into highly effective, well-structured prompts.';
    
    // Add the pillar structure if present
    if (template.pillars && template.pillars.length > 0) {
      systemMessage += "\n\nFRAMEWORK STRUCTURE:";
      template.pillars.forEach(pillar => {
        systemMessage += `\n${pillar.name}: ${pillar.description}`;
      });
    }
    
    systemMessage += "\n\nTASK: You will be provided with an intent and context information, which may be as brief as two sentences or as extensive as a comprehensive brief. Your job is to enhance this prompt by applying best practices and instructions. Improve clarity, grammar, structure, and logical flow while preserving the original intent.";
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openAIApiKey
    });

    // Create the prompt for GPT
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `Transform this prompt into an enhanced version following the framework provided:

ORIGINAL PROMPT:
${originalPrompt}

CONTEXT FROM USER:
${context}

Create an enhanced prompt that clearly defines all required elements in the framework while maintaining natural flow and clarity. Focus especially on creating a prompt that can be immediately used in another AI platform with excellent results.` }
    ];

    try {
      // Make the API call
      const completion = await openai.chat.completions.create({
        model: "o3-mini",
        messages: messages,
        temperature: template.temperature || 0.7,
        max_tokens: template.max_chars ? Math.round(template.max_chars / 4) : 1000
      });

      const enhancedPrompt = completion.choices[0].message.content;
      
      return new Response(JSON.stringify({ 
        enhancedPrompt,
        loadingMessage: `Enhancing prompt with ${template.title}...`,
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
    console.error("Error in use-prompt-template function:", error);
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
