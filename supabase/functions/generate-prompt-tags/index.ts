
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
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `You are a prompt categorization expert. Your task is to analyze the given prompt and generate EXACTLY 3 main categories with 1 subcategory for each. 

Each main category should represent a distinct aspect or use case of the prompt. For example, categories might include writing, coding, business, education, marketing, creative, technical, etc.

Each subcategory should be more specific within its main category. For example, if the main category is "writing", the subcategory might be "blog", "essay", "story", etc.

Respond with a JSON array containing exactly 3 objects, each with 'category' and 'subcategory' properties. Use single words for both category and subcategory whenever possible.

Example response format:
[
  {"category": "writing", "subcategory": "blog"},
  {"category": "marketing", "subcategory": "social"},
  {"category": "business", "subcategory": "strategy"}
]

Make your categorization diverse across different domains to capture the full range of potential uses for this prompt.`
          },
          { role: 'user', content: promptText }
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API returned status ${openAIResponse.status}: ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response received successfully');
    
    let tags;
    try {
      // Attempt to parse the response as JSON
      const content = openAIData.choices[0].message.content.trim();
      tags = JSON.parse(content);
      
      // Ensure we have exactly 3 categories
      if (Array.isArray(tags)) {
        if (tags.length > 3) {
          tags = tags.slice(0, 3);
        } else if (tags.length < 3) {
          // Fill with default tags if we have fewer than 3
          const defaultCategories = [
            { category: "writing", subcategory: "creative" },
            { category: "business", subcategory: "strategy" },
            { category: "technical", subcategory: "coding" }
          ];
          
          while (tags.length < 3) {
            const defaultTag = defaultCategories[tags.length];
            if (!tags.some(t => t.category === defaultTag.category)) {
              tags.push(defaultTag);
            } else {
              // Find another default tag that's not already used
              for (const backup of defaultCategories) {
                if (!tags.some(t => t.category === backup.category)) {
                  tags.push(backup);
                  break;
                }
              }
              
              // If we still need more tags, create generic ones
              if (tags.length < 3) {
                tags.push({ category: `category${tags.length + 1}`, subcategory: `subcategory${tags.length + 1}` });
              }
            }
          }
        }
      }
      
      console.log('Tags generated successfully:', tags);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.log('Raw content:', openAIData.choices[0].message.content);
      
      // If parsing fails, create structured tags using a fallback approach
      tags = extractTagsFromText(openAIData.choices[0].message.content);
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
          // Ensure we have exactly 3 tags
          if (parsed.length > 3) {
            return parsed.slice(0, 3);
          } else if (parsed.length < 3) {
            const result = [...parsed];
            // Fill with default tags if we have fewer than 3
            for (let i = parsed.length; i < 3; i++) {
              result.push(defaultTags[i]);
            }
            return result;
          }
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
      } else {
        // Try to match numbered items with main categories and subcategories
        const numberedMatch = line.match(/^\s*\d+\.\s*([\w\s]+)(?:-|:)\s*([\w\s]+)/i);
        if (numberedMatch) {
          pairs.push({
            category: numberedMatch[1].trim().toLowerCase().split(/\s+/)[0], // Take first word of category
            subcategory: numberedMatch[2].trim().toLowerCase().split(/\s+/)[0] // Take first word of subcategory
          });
          if (pairs.length >= 3) break;
        }
      }
    }
    
    // Ensure we have exactly 3 tags
    if (pairs.length > 3) {
      return pairs.slice(0, 3);
    } else if (pairs.length < 3) {
      const result = [...pairs];
      // Fill with default tags if we have fewer than 3
      for (let i = pairs.length; i < 3; i++) {
        result.push(defaultTags[i]);
      }
      return result;
    }
    
    return pairs.length > 0 ? pairs : defaultTags;
  } catch (error) {
    console.error('Error extracting tags from text:', error);
    return defaultTags;
  }
}
