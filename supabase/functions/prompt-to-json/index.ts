
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

// Helper function to add exponential backoff retry for OpenAI API calls
async function callOpenAIWithRetry(systemMessage: string, prompt: string, maxRetries = 3) {
  let retries = 0;
  let lastError = null;

  while (retries < maxRetries) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: `Analyze this prompt and convert to the specified JSON structure: ${prompt}` }
          ],
          temperature: 0.3,
        }),
      });
      
      if (response.status === 429) {
        // Rate limit error - get retry-after header or use exponential backoff
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, retries) * 1000;
        console.log(`Rate limit hit. Retrying after ${waitTime}ms (Attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API responded with status ${response.status}: ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Only retry on rate limiting or network errors
      if (error.message && (error.message.includes('429') || error.message.includes('rate_limit'))) {
        const waitTime = Math.pow(2, retries) * 1000;
        console.log(`Error (likely rate limit). Retrying after ${waitTime}ms (Attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      } else {
        // For other errors, don't retry
        throw error;
      }
    }
  }
  
  // If we've exhausted all retries
  throw lastError || new Error('Failed after maximum retry attempts');
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
    
    // Try to call OpenAI with automatic retries for rate limiting
    let data;
    try {
      data = await callOpenAIWithRetry(systemMessage, prompt);
    } catch (error) {
      console.error("Failed to call OpenAI after retries:", error);
      // Return a fallback JSON structure in case of failure
      return new Response(JSON.stringify({
        jsonStructure: {
          title: "Prompt Analysis",
          summary: "Automatic analysis of provided prompt",
          sections: [
            { title: "Content", content: prompt.slice(0, 200) + (prompt.length > 200 ? "..." : "") }
          ],
          generationError: "Failed to generate structured JSON. Please try again later."
        },
        rawPrompt: prompt
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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
      
      // Extract variable placeholders from the prompt
      const variablePlaceholders = extractVariablePlaceholders(prompt);
      if (variablePlaceholders.length > 0) {
        jsonResult.variablePlaceholders = variablePlaceholders;
      }
      
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

// Helper function to extract variable placeholders from the prompt
function extractVariablePlaceholders(text: string): string[] {
  const regex = /{{([^{}]+)}}/g;
  const placeholders: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const varName = match[1].trim();
    if (varName && !placeholders.includes(varName)) {
      placeholders.push(varName);
    }
  }
  
  return placeholders;
}
