
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
            content: 'You are an AI expert who keeps track of the latest AI models. Create a list of the top 15 most used LLM models with their details.'
          },
          {
            role: 'user',
            content: 'Provide a comprehensive list of the top 15 most used LLM models with their detailed strengths and limitations. Format the response as a JSON array with each model having name, provider, description, strengths (array), and limitations (array) fields.'
          }
        ],
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
    let modelsData;
    try {
      modelsData = JSON.parse(data.choices[0].message.content);
      console.log(`Successfully parsed model data, found ${modelsData.length} models`);
    } catch (parseError) {
      console.error('Error parsing JSON from OpenAI response:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse model data from OpenAI');
    }

    if (!Array.isArray(modelsData)) {
      console.error('Parsed data is not an array:', modelsData);
      throw new Error('Invalid model data format: not an array');
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
