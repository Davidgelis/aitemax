
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
    
    // First, prioritize models with missing data (newly added models)
    const { data: incompleteModels, error: incompleteError } = await supabase
      .from('ai_models')
      .select('*')
      .is('is_deleted', null)
      .or('description.is.null,strengths.is.null,limitations.is.null');
    
    if (incompleteError) {
      throw new Error(`Error fetching incomplete models: ${incompleteError.message}`);
    }
    
    console.log(`Found ${incompleteModels?.length || 0} incomplete models that need enhancement`);
    
    // Process only incomplete models if there are any
    const models = incompleteModels || [];
    
    if (models.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No incomplete models found that need enhancement",
          incompleteModelsCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process each model with AI enhancement
    let enhancedCount = 0;
    
    for (const model of models) {
      try {
        console.log(`Enhancing incomplete model: ${model.name} (${model.provider || 'Unknown provider'})`);
        
        // Generate AI-powered description, strengths, and limitations
        const promptText = `
        Create a detailed analysis of the AI model "${model.name}" by ${model.provider || 'an unknown provider'}. 
        Format your response as a JSON object with the following keys:
        1. description: A comprehensive description of the model, focusing on its purpose, capabilities, and typical use cases.
        2. strengths: An array of 4-6 specific strengths or advantages of this model.
        3. limitations: An array of 4-6 specific limitations or weaknesses of this model.
        
        Make your response specific to this model based on what is publicly known about it, and ensure all information is factual.
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
                content: 'You are an AI expert tasked with creating detailed, factual information about AI models. Return ONLY valid JSON without code blocks or markdown.'
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
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString()
        };
        
        if (!model.description && analysisData.description) {
          updateData.description = analysisData.description;
        }
        
        if ((!model.strengths || model.strengths.length === 0) && analysisData.strengths) {
          updateData.strengths = analysisData.strengths;
        }
        
        if ((!model.limitations || model.limitations.length === 0) && analysisData.limitations) {
          updateData.limitations = analysisData.limitations;
        }
        
        // Only update if we have data to update
        if (Object.keys(updateData).length > 1) { // More than just updated_at
          console.log(`Updating model ${model.name} with AI-generated data`);
          const { error: updateError } = await supabase
            .from('ai_models')
            .update(updateData)
            .eq('id', model.id);
          
          if (updateError) {
            console.error(`Error updating model ${model.name}:`, updateError);
            continue;
          }
          
          enhancedCount++;
          console.log(`Successfully enhanced model: ${model.name}`);
        } else {
          console.log(`No new data to update for model ${model.name}`);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (modelError) {
        console.error(`Error enhancing model ${model.name}:`, modelError);
        // Continue with the next model even if one fails
      }
    }
    
    console.log(`AI enhancement completed. Enhanced ${enhancedCount} out of ${models.length} incomplete models`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully enhanced ${enhancedCount} models with AI-generated information`,
        enhancedCount,
        totalIncompleteModels: models.length
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
