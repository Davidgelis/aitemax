
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
  },
  {
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "A balanced model from Anthropic offering strong performance with improved efficiency.",
    strengths: ["Excellent instruction following", "Good balance of quality and speed", "Reduced hallucinations", "Strong reasoning"],
    limitations: ["Not as powerful as Claude 3 Opus", "Limited knowledge cutoff", "May struggle with complex multi-step reasoning"]
  },
  {
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "OpenAI's efficient and cost-effective language model for most everyday tasks.",
    strengths: ["Fast response times", "Low cost", "Good general capabilities", "Widely used and tested"],
    limitations: ["Less capable on complex tasks than GPT-4", "Limited reasoning ability", "May produce more hallucinations than newer models"]
  },
  {
    name: "Llama 3 70B",
    provider: "Meta",
    description: "The largest variant of Meta's Llama 3 family with strong overall performance.",
    strengths: ["Strong performance across tasks", "Open weights for research", "Good instruction following", "Competitive with closed models"],
    limitations: ["High hardware requirements", "Less training data than proprietary alternatives", "May lag behind commercial alternatives in some areas"]
  },
  {
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Anthropic's fastest and most compact model, designed for low-latency applications.",
    strengths: ["Very fast response times", "Low cost", "Good for real-time applications", "Maintains accuracy on many tasks"],
    limitations: ["Reduced capabilities compared to larger Claude models", "Limited context window", "Less capable on complex reasoning"]
  },
  {
    name: "Mistral Large",
    provider: "Mistral AI",
    description: "Mistral AI's flagship model, optimized for performance and versatility.",
    strengths: ["Strong performance across reasoning tasks", "Good instruction following", "Competitive with larger models", "Efficient architecture"],
    limitations: ["Less established than models from larger companies", "Limited training data compared to some alternatives"]
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI models update process');
    
    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized with service role key');

    // Check if we already have models in the database
    const { data: existingModels, error: checkError } = await supabase
      .from('ai_models')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing models:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }
    
    const hasExistingModels = existingModels && existingModels.length > 0;
    console.log(`Database has existing models: ${hasExistingModels}`);
    
    // Only proceed with update if:
    // 1. No models exist in database, OR
    // 2. We're explicitly forcing an update
    const forceUpdate = req.method === 'POST' && req.headers.get('X-Force-Update') === 'true';
    
    if (hasExistingModels && !forceUpdate) {
      console.log('Models already exist and no force update requested - skipping update');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Models already exist, no update needed',
        skipped: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Clear existing models before inserting new ones
    if (hasExistingModels) {
      console.log('Clearing existing models from database');
      const { error: deleteError } = await supabase
        .from('ai_models')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('Error deleting existing models:', deleteError);
        throw new Error(`Database error when clearing models: ${deleteError.message}`);
      }
    }

    // Use the service role key to bypass RLS and insert the models
    console.log('Inserting models using service role key to bypass RLS');
    let insertedCount = 0;
    
    for (const model of fallbackModels) {
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

    console.log(`AI models update completed. Successfully inserted ${insertedCount} of ${fallbackModels.length} models.`);
    return new Response(JSON.stringify({ 
      success: true, 
      totalModels: fallbackModels.length,
      insertedModels: insertedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
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
