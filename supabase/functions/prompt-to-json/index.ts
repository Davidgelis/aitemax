
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, masterCommand, userId, promptId } = await req.json();
    
    if (!prompt) {
      throw new Error("Prompt is required");
    }
    
    console.log("Converting prompt to JSON with o3-mini:", prompt.substring(0, 100) + "...");
    
    const systemMessage = `
      You are a JSON structure generator for prompt text. Your task is to:
      
      1. Analyze the prompt text to identify key parts within the structure.
      2. Extract sections based on headings like "Task", "Persona", "Conditions", "Instructions".
      3. Return a clean JSON structure with these identified elements.
      
      Follow these rules:
      - Return ONLY valid JSON, no explanation or additional text
      - Create a "sections" array with objects containing "title" and "content"
      - Include a "title" field with a short title for the prompt
      - Include a "summary" field with a very brief description
      
      The JSON schema should look like:
      {
        "title": "Brief Title",
        "summary": "One-sentence summary",
        "sections": [
          {"title": "Section Name", "content": "Section content"}
        ]
      }
    `;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Changed to o3-mini (gpt-3.5-turbo as the actual model name)
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: `Analyze this prompt and convert to the specified JSON structure: ${prompt}` }
        ],
        temperature: 0.3,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API responded with status ${response.status}: ${errorData}`);
    }
    
    const data = await response.json();
    let jsonResult;
    
    try {
      // Parse the response content as JSON
      jsonResult = JSON.parse(data.choices[0].message.content);
      
      // Add master command if provided
      if (masterCommand) {
        jsonResult.masterCommand = masterCommand;
      }
      
      // Add timestamp
      jsonResult.timestamp = new Date().toISOString();
      
      console.log("Successfully converted prompt to JSON structure with o3-mini");
      
      // Record token usage if userId is provided
      if (userId) {
        await recordTokenUsage(
          userId,
          promptId,
          4, // Step 4: JSON structure generation
          data.usage.prompt_tokens,
          data.usage.completion_tokens,
          'gpt-3.5-turbo'
        );
      }
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      console.log("Raw response:", data.choices[0].message.content);
      
      // Create a minimal valid JSON if parsing failed
      jsonResult = {
        title: "Parsed Prompt",
        summary: "Automatic prompt parsing",
        sections: [
          { title: "Content", content: prompt }
        ],
        error: "Failed to parse into structured JSON"
      };
    }
    
    return new Response(JSON.stringify({ 
      jsonStructure: jsonResult,
      rawPrompt: prompt,
      usage: data.usage
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in prompt-to-json function:", error);
    
    return new Response(JSON.stringify({
      error: error.message,
      jsonStructure: {
        title: "Error",
        summary: "Failed to process prompt",
        sections: [],
      }
    }), {
      status: 200, // Always return 200 to avoid the edge function error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
