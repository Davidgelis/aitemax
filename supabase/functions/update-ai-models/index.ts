
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define fallback model data to use if OpenAI API fails
const fallbackModels = [
  {
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's most advanced multimodal model combining vision and language capabilities.",
    strengths: ["Multimodal capabilities", "State-of-the-art performance", "Handles complex reasoning", "Faster processing than GPT-4"],
    limitations: ["May produce convincing but incorrect information", "Limited knowledge cutoff", "Not specialized for specific domains"]
  },
  {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Anthropic's most capable model with excellent performance across reasoning, math, and coding tasks.",
    strengths: ["Strong reasoning abilities", "Code generation", "Less tendency to hallucinate", "Good at following instructions"],
    limitations: ["Higher latency than smaller models", "Less widely available than some competitors", "Limited context window"]
  },
  {
    name: "Llama 3",
    provider: "Meta",
    description: "Meta's latest open-source large language model with improved reasoning and instruction following.",
    strengths: ["Open-source architecture", "Strong performance for its size", "Active community development", "Multiple size variants"],
    limitations: ["Smaller context window than some competitors", "Less training data than closed models", "May require more explicit prompting"]
  },
  {
    name: "GPT-4o mini",
    provider: "OpenAI",
    description: "A smaller, faster, and more cost-effective version of GPT-4o.",
    strengths: ["Faster response time", "Lower cost", "Good balance of performance and efficiency", "Multimodal capabilities"],
    limitations: ["Less capable than full GPT-4o on complex tasks", "Reduced reasoning ability compared to larger models", "Limited context window"]
  },
  {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Google's advanced multimodal model with extended context window and improved reasoning.",
    strengths: ["Very large context window", "Strong multimodal understanding", "Good reasoning capabilities", "Efficient processing"],
    limitations: ["May struggle with certain specialized domains", "Potential for generating incorrect information", "Less tested than some alternatives"]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI models update process');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if we already have models in the database
    const { data: existingModels, error: checkError } = await supabase
      .from('ai_models')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing models:', checkError);
    }
    
    const hasExistingModels = existingModels && existingModels.length > 0;
    console.log(`Database has existing models: ${hasExistingModels}`);
    
    // Skip update if we already have models and request doesn't force update
    const forceUpdate = req.method === 'POST' && req.headers.get('X-Force-Update') === 'true';
    if (hasExistingModels && !forceUpdate) {
      console.log('Models already exist and no force update requested - skipping update');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Models already exist, no update needed',
        skipped: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let modelsData;
    try {
      console.log('Fetching AI model data from OpenAI');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an AI expert who keeps track of the latest AI models.'
            },
            {
              role: 'user',
              content: 'Return a JSON array of the top 15 most used LLM models with their details. Each model should have name, provider, description, strengths (array), and limitations (array). Return ONLY valid JSON with no explanation or markdown.'
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error: ${response.status} - ${errorText}`);
        throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received response from OpenAI');
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid response structure from OpenAI:', JSON.stringify(data));
        throw new Error('Invalid response from OpenAI');
      }
      
      console.log('Parsing model data');
      try {
        const content = data.choices[0].message.content;
        console.log('Raw content:', content);
        
        const parsedData = JSON.parse(content);
        if (parsedData.models && Array.isArray(parsedData.models)) {
          modelsData = parsedData.models;
        } else if (Array.isArray(parsedData)) {
          modelsData = parsedData;
        } else {
          console.error('Parsed data has unexpected structure:', parsedData);
          throw new Error('Invalid model data format: unexpected structure');
        }
        
        console.log(`Successfully parsed model data, found ${modelsData.length} models`);
      } catch (parseError) {
        console.error('Error parsing JSON from OpenAI response:', parseError);
        console.error('Raw content:', data.choices[0].message.content);
        throw new Error('Failed to parse model data from OpenAI');
      }
    } catch (openaiError) {
      console.error('Error with OpenAI API, using fallback models:', openaiError);
      modelsData = fallbackModels;
      console.log(`Using ${modelsData.length} fallback models instead`);
    }

    if (!Array.isArray(modelsData)) {
      console.error('Model data is not an array, using fallback models');
      modelsData = fallbackModels;
    }

    // Clear existing models and insert new ones
    console.log('Clearing existing models from database');
    const { error: deleteError } = await supabase
      .from('ai_models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('Error deleting existing models:', deleteError);
      throw new Error(`Database error when clearing models: ${deleteError.message}`);
    }

    console.log('Inserting new models into database');
    let insertedCount = 0;
    for (const model of modelsData) {
      console.log(`Inserting model: ${model.name}`);
      const { error: insertError } = await supabase
        .from('ai_models')
        .insert({
          name: model.name,
          provider: model.provider,
          description: model.description,
          strengths: model.strengths,
          limitations: model.limitations,
        });
      
      if (insertError) {
        console.error(`Error inserting model ${model.name}:`, insertError);
        continue;
      }
      
      insertedCount++;
    }

    console.log(`AI models update completed. Successfully inserted ${insertedCount} of ${modelsData.length} models.`);
    return new Response(JSON.stringify({ 
      success: true, 
      totalModels: modelsData.length,
      insertedModels: insertedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating AI models:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
