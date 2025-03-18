import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Improved helper function to record token usage in Supabase
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

// Enhanced helper function to add exponential backoff retry for OpenAI API calls
async function callOpenAIWithRetry(systemMessage: string, prompt: string, maxRetries = 5) {
  let retries = 0;
  let lastError = null;

  // Increase initial delay to reduce rate limit issues
  const initialDelay = 5000; // 5 seconds initial delay (increased from 3s)
  
  // Create a hash of the prompt for logging/tracking
  const promptHash = await createSimpleHash(prompt);
  console.log(`Processing prompt with hash: ${promptHash}`);
  
  while (retries < maxRetries) {
    try {
      if (retries > 0) {
        console.log(`Retry attempt ${retries + 1}/${maxRetries} for prompt ${promptHash.substring(0, 8)}...`);
      } else {
        console.log(`Initial attempt for prompt ${promptHash.substring(0, 8)}...`);
      }
      
      console.log(`Prompt length: ${prompt.length} characters`);
      
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
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : initialDelay * Math.pow(2, retries);
        console.log(`Rate limit hit. Retrying after ${waitTime}ms (Attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`OpenAI API error: Status ${response.status}, Response: ${errorData}`);
        throw new Error(`OpenAI API responded with status ${response.status}: ${errorData}`);
      }
      
      const responseData = await response.json();
      console.log(`OpenAI API response received successfully for prompt ${promptHash.substring(0, 8)}`);
      return responseData;
    } catch (error) {
      lastError = error;
      console.error(`Error in OpenAI API call (attempt ${retries + 1}):`, error);
      
      // Only retry on rate limiting or network errors
      if (error.message && (error.message.includes('429') || error.message.includes('rate_limit') || error.message.includes('network'))) {
        // Increased backoff time to handle rate limits better
        const waitTime = initialDelay * Math.pow(2, retries);
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

// Simple hash function for tracking prompts without storing full text
async function createSimpleHash(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error("Error creating hash:", error);
    // Fallback if crypto API not available
    return Math.random().toString(36).substring(2, 10);
  }
}

// Global in-memory cache with expiration
type CacheEntry = {
  jsonStructure: any;
  usage: any;
  timestamp: number;
};

// Using a map with expiration management
const promptCache = new Map<string, CacheEntry>();
const CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutes cache expiration

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of promptCache.entries()) {
    if (now - entry.timestamp > CACHE_EXPIRATION) {
      promptCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, masterCommand, userId, promptId, forceRefresh } = await req.json();
    
    if (!prompt) {
      throw new Error("Prompt is required");
    }
    
    // Generate a hash of the incoming prompt for caching
    const promptHash = await createSimpleHash(prompt);
    console.log(`Received prompt with hash: ${promptHash.substring(0, 8)}`);
    console.log(`Original prompt length: ${prompt.length}`);
    console.log(`Force refresh requested: ${forceRefresh ? 'yes' : 'no'}`);
    
    // Check if we have a valid cached result and forceRefresh is not true
    if (!forceRefresh && promptCache.has(promptHash)) {
      const cacheEntry = promptCache.get(promptHash)!;
      const now = Date.now();
      
      // Only use cache if it hasn't expired
      if (now - cacheEntry.timestamp < CACHE_EXPIRATION) {
        console.log(`Cache hit! Using cached result for prompt ${promptHash.substring(0, 8)}`);
        
        return new Response(JSON.stringify({ 
          jsonStructure: cacheEntry.jsonStructure,
          rawPrompt: prompt,
          usage: cacheEntry.usage,
          fromCache: true
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log(`Cache expired for prompt ${promptHash.substring(0, 8)}`);
        promptCache.delete(promptHash); // Clean up expired entry
      }
    }
    
    // No cache hit or forceRefresh is true, proceed with API call
    if (forceRefresh) {
      console.log(`Force refresh requested for prompt ${promptHash.substring(0, 8)}`);
    } else {
      console.log(`Cache miss for prompt ${promptHash.substring(0, 8)}, calling OpenAI API`);
    }
    
    // The prompt should be clean text at this point
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
      - DO NOT include timestamps or date information
      
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
      console.log(`Calling OpenAI API for prompt ${promptHash.substring(0, 8)}...`);
      data = await callOpenAIWithRetry(systemMessage, prompt);
      console.log(`OpenAI API call successful for prompt ${promptHash.substring(0, 8)}`);
    } catch (error) {
      console.error(`Failed to call OpenAI after retries for prompt ${promptHash.substring(0, 8)}:`, error);
      // Return a fallback JSON structure in case of failure
      const fallbackResponse = {
        jsonStructure: {
          title: "Prompt Analysis",
          summary: "Automatic analysis of provided prompt",
          sections: [
            { title: "Content", content: prompt.slice(0, 200) + (prompt.length > 200 ? "..." : "") }
          ],
          generationError: "Failed to generate structured JSON. Please try again later."
        },
        rawPrompt: prompt
      };
      
      return new Response(JSON.stringify(fallbackResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let jsonResult;
    
    try {
      // Parse the response content as JSON
      console.log(`Parsing OpenAI response to JSON for prompt ${promptHash.substring(0, 8)}`);
      jsonResult = JSON.parse(data.choices[0].message.content);
      
      // Add master command if provided
      if (masterCommand) {
        jsonResult.masterCommand = masterCommand;
      }
      
      // Extract variable placeholders from the prompt
      const variablePlaceholders = extractVariablePlaceholders(prompt);
      if (variablePlaceholders.length > 0) {
        jsonResult.variablePlaceholders = variablePlaceholders;
      }
      
      // Explicitly remove any timestamp fields if they still exist
      if (jsonResult.timestamp) {
        delete jsonResult.timestamp;
      }
      
      console.log(`Successfully converted prompt to JSON structure for prompt ${promptHash.substring(0, 8)}`);
      
      // Cache the result with timestamp for future requests
      promptCache.set(promptHash, {
        jsonStructure: jsonResult,
        usage: data.usage,
        timestamp: Date.now()
      });
      
      // Record token usage if userId is provided - FIRE AND FORGET PATTERN
      if (userId) {
        // Run token usage recording without blocking the response
        recordTokenUsage(
          userId,
          promptId,
          4, // Step 4: JSON structure generation
          data.usage.prompt_tokens,
          data.usage.completion_tokens,
          'gpt-3.5-turbo'
        ).catch((err) => console.error("Token usage recording failed:", err));
      }
    } catch (parseError) {
      console.error(`Error parsing JSON response for prompt ${promptHash.substring(0, 8)}:`, parseError);
      console.log("Raw response from OpenAI:", data.choices[0].message.content);
      
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
