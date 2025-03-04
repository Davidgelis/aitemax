
// This Edge Function uses AI to enhance information about AI models in the database
// It enriches models with detailed descriptions, strengths, and limitations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

// Define response headers with CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Connect to Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// The OpenAI API key for AI integration
const openAIApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OpenAI API key not configured. Please add it to the Edge Function secrets."
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Starting AI enhancement for models...');
    
    // First, prioritize models with missing data
    const { data: missingDataModels, error: missingDataError } = await supabase
      .from('ai_models')
      .select('*')
      .is('is_deleted', null)
      .or('description.is.null,strengths.is.null,limitations.is.null');
    
    if (missingDataError) {
      throw new Error(`Error fetching models with missing data: ${missingDataError.message}`);
    }
    
    console.log(`Found ${missingDataModels?.length || 0} models with missing data`);
    
    // Then get all other non-deleted models
    const { data: completeModels, error: completeModelsError } = await supabase
      .from('ai_models')
      .select('*')
      .is('is_deleted', null)
      .not('description', 'is', null)
      .not('strengths', 'is', null) 
      .not('limitations', 'is', null);
    
    if (completeModelsError) {
      throw new Error(`Error fetching complete models: ${completeModelsError.message}`);
    }
    
    // Combine models, prioritizing those with missing data
    const models = [
      ...(missingDataModels || []),
      ...(completeModels || [])
    ];
    
    console.log(`Processing ${models.length} total models`);
    
    if (models.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No models found to enhance",
          modelsCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process each model with AI enhancement
    let enhancedCount = 0;
    
    for (const model of models) {
      try {
        console.log(`Enhancing model: ${model.name} (${model.provider || 'Unknown provider'})`);
        
        // Generate AI-powered description, strengths, and limitations
        const promptText = `
        Create a brief analysis of the AI model "${model.name}" by ${model.provider || 'an unknown provider'}. 
        Format your response as a JSON object with the following keys:
        1. description: A single sentence (max 100 characters) that MUST specify what applications this model is best suited for (e.g., coding, content writing, image analysis, data processing, chat, etc.)
        2. strengths: An array of exactly 3 short phrases (each max 30 characters) highlighting key strengths.
        3. limitations: An array of exactly 3 short phrases (each max 30 characters) highlighting key limitations.
        
        Be very concise and specific. Each strength and limitation should be a brief phrase, not a full sentence.
        The description MUST mention the specific applications the model excels at.
        Return only valid JSON with those three keys.
        `;
        
        // Call OpenAI API for model analysis
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an AI expert tasked with creating concise, factual information about AI models. Return ONLY valid JSON without code blocks or markdown.'
              },
              {
                role: 'user',
                content: promptText
              }
            ],
            temperature: 0.7,
          }),
        });
        
        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          throw new Error(`OpenAI API error: ${aiResponse.status} - ${errorText}`);
        }
        
        const aiData = await aiResponse.json();
        const modelAnalysis = aiData.choices[0].message.content;
        
        // Try to parse the JSON response from the AI
        let analysisData;
        try {
          // Remove any markdown code block syntax if present
          const cleanJSON = modelAnalysis.replace(/```json|```/g, '').trim();
          analysisData = JSON.parse(cleanJSON);
          console.log(`Successfully parsed AI response for model ${model.name}`);
        } catch (parseError) {
          console.error(`Error parsing AI response for model ${model.name}:`, parseError);
          console.log('Raw AI response:', modelAnalysis);
          continue; // Skip this model and move to the next
        }
        
        // Update the model with the AI-generated content
        const { error: updateError } = await supabase
          .from('ai_models')
          .update({
            description: analysisData.description,
            strengths: analysisData.strengths,
            limitations: analysisData.limitations,
            updated_at: new Date().toISOString()
          })
          .eq('id', model.id);
        
        if (updateError) {
          console.error(`Error updating model ${model.name}:`, updateError);
          continue;
        }
        
        enhancedCount++;
        console.log(`Successfully enhanced model: ${model.name}`);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (modelError) {
        console.error(`Error enhancing model ${model.name}:`, modelError);
        // Continue with the next model even if one fails
      }
    }
    
    console.log(`AI enhancement completed. Enhanced ${enhancedCount} out of ${models.length} models`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully enhanced ${enhancedCount} models with AI-generated information`,
        enhancedCount,
        totalModels: models.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in enhance-ai-models function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
