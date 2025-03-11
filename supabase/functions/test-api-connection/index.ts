
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    if (!openAIApiKey) {
      console.error("Missing OpenAI API key");
      return new Response(JSON.stringify({
        success: false,
        message: "OpenAI API key is not configured in the environment",
      }), {
        status: 200, // Return 200 even on error to avoid edge function errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test connection to OpenAI API with a simple request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Using a smaller model for the test
        messages: [
          {role: 'system', content: 'You are a helpful assistant.'},
          {role: 'user', content: 'Test connection'}
        ],
        max_tokens: 5, // Minimal tokens for a quick test
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      
      return new Response(JSON.stringify({
        success: false,
        message: `Failed to connect to OpenAI API: ${response.status} ${response.statusText}`,
        details: errorText
      }), {
        status: 200, // Return 200 even on error to avoid edge function errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      message: "Successfully connected to OpenAI API",
      model: data.model,
      tokenCount: data.usage?.total_tokens || 0
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error testing API connection:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: `Error testing API connection: ${error.message}`,
    }), {
      status: 200, // Return 200 even on error to avoid edge function errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
