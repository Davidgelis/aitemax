
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { promptText } = await req.json();
    
    if (!promptText || typeof promptText !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid or missing prompt text" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing prompt text (length: ${promptText.length}) for tag generation`);
    
    // Call OpenAI to analyze the prompt and generate tags
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",  // Updated to use the exact model name
        messages: [
          { 
            role: 'system', 
            content: `You are a tag generator for AI prompts. Analyze the given prompt and generate 3 main category tags, 
            each with a specific subcategory tag. Each tag should be a single word that categorizes the prompt by the main 
            task or type of work it's used for. Respond with a JSON array of objects, each with 'category' and 'subcategory' 
            properties. Be concise and accurate.`
          },
          { role: 'user', content: promptText }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API returned status ${openAIResponse.status}: ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('GPT-4.1 mini response received successfully');
    
    let tags;
    try {
      // Attempt to parse the response as JSON
      const content = openAIData.choices[0].message.content.trim();
      tags = JSON.parse(content);
      
      console.log('Tags generated successfully:', tags);
    } catch (parseError) {
      console.error('Failed to parse GPT-4.1 mini response as JSON:', parseError);
      console.log('Raw content:', openAIData.choices[0].message.content);
      
      // If parsing fails, attempt to extract the tags using regex or other means
      const content = openAIData.choices[0].message.content;
      
      // Create a structured format by extracting information using a simpler approach
      tags = extractTagsFromText(content);
      console.log('Tags extracted from text:', tags);
    }

    return new Response(
      JSON.stringify({ 
        tags,
        usage: openAIData.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-prompt-tags function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to extract tags if JSON parsing fails
function extractTagsFromText(text: string): Array<{category: string, subcategory: string}> {
  const defaultTags = [
    { category: "writing", subcategory: "creative" },
    { category: "coding", subcategory: "web" },
    { category: "business", subcategory: "marketing" }
  ];
  
  try {
    // Try to find content that looks like JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse extracted JSON:', e);
      }
    }
    
    // If we can't find or parse JSON, try to extract category/subcategory pairs
    const pairs = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Look for patterns like "Category: X, Subcategory: Y" or "1. X - Y"
      const categorySubcategoryMatch = line.match(/(?:category:?\s*)([\w]+)(?:.*subcategory:?\s*)([\w]+)/i);
      if (categorySubcategoryMatch) {
        pairs.push({
          category: categorySubcategoryMatch[1].toLowerCase(),
          subcategory: categorySubcategoryMatch[2].toLowerCase()
        });
        if (pairs.length >= 3) break;
      }
    }
    
    return pairs.length > 0 ? pairs : defaultTags;
  } catch (error) {
    console.error('Error extracting tags from text:', error);
    return defaultTags;
  }
}
