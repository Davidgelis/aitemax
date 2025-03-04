
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

    const data = await response.json();
    console.log('Received response from OpenAI');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }
    
    console.log('Parsing model data');
    const modelsData = JSON.parse(data.choices[0].message.content);

    // Clear existing models and insert new ones
    console.log('Clearing existing models from database');
    await supabase
      .from('ai_models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Inserting new models into database');
    for (const model of modelsData) {
      console.log(`Inserting model: ${model.name}`);
      await supabase
        .from('ai_models')
        .insert({
          name: model.name,
          provider: model.provider,
          description: model.description,
          strengths: model.strengths,
          limitations: model.limitations,
        });
    }

    console.log('AI models update completed successfully');
    return new Response(JSON.stringify({ success: true, count: modelsData.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating AI models:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
