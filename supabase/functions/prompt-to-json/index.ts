
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { promptText } = await req.json();
    
    if (!promptText) {
      throw new Error("Empty prompt text provided");
    }
    
    console.log(`Converting prompt to JSON: "${promptText.substring(0, 50)}..."`);
    
    const systemPrompt = `
      You are a specialized AI that converts structured prompts into JSON format.
      
      Take the provided prompt and convert it into a JSON structure with the following format:
      {
        "title": "Brief title extracted from the prompt",
        "sections": [
          {
            "type": "task", 
            "content": "Task section content",
            "variables": [
              {"name": "variableName", "value": "currentValue"}
            ]
          },
          {
            "type": "persona", 
            "content": "Persona section content",
            "variables": [
              {"name": "variableName", "value": "currentValue"}
            ]
          },
          {
            "type": "conditions", 
            "content": "Conditions section content",
            "variables": [
              {"name": "variableName", "value": "currentValue"}
            ]
          },
          {
            "type": "instructions", 
            "content": "Instructions section content",
            "variables": [
              {"name": "variableName", "value": "currentValue"}
            ]
          }
        ]
      }
      
      Analyze the prompt carefully to identify:
      1. The title (often at the beginning, formatted as "**[TITLE]**" or similar)
      2. The four main sections (Task, Persona, Conditions, Instructions)
      3. Potential variables (important contextual words that might be replaced)
      
      For variables, look for:
      - Domain-specific terms
      - Names of tools, platforms or technologies
      - Numerical values or parameters
      - Any formatted or specially emphasized words/phrases
      
      Your response should be a valid JSON object and nothing else. Do not include any explanations or markdown.
    `;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptText }
        ],
        temperature: 0.2, // Lower temperature for more deterministic JSON parsing
      }),
    });
    
    if (!response.ok) {
      let errorMessage = `OpenAI API responded with status ${response.status}`;
      try {
        const errorData = await response.text();
        console.error("OpenAI API error:", errorData);
        errorMessage += `: ${errorData}`;
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI API");
    }
    
    // Parse the content as JSON
    let jsonResult;
    try {
      jsonResult = JSON.parse(data.choices[0].message.content);
      console.log("Successfully parsed prompt to JSON structure");
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", parseError);
      console.log("Raw response:", data.choices[0].message.content);
      
      // Attempt to fix common JSON parsing issues
      const content = data.choices[0].message.content;
      const cleanedContent = content
        .replace(/^```json\s*/, '') // Remove markdown JSON prefix if present
        .replace(/\s*```$/, '');    // Remove trailing markdown if present
      
      try {
        jsonResult = JSON.parse(cleanedContent);
        console.log("Successfully parsed JSON after cleaning");
      } catch (secondError) {
        throw new Error("Failed to parse response as JSON structure");
      }
    }
    
    return new Response(JSON.stringify({ 
      jsonStructure: jsonResult,
      usage: data.usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in prompt-to-json function:", error);
    
    return new Response(JSON.stringify({
      error: error.message,
      jsonStructure: null
    }), {
      status: 200, // Always return 200 to avoid edge function error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
