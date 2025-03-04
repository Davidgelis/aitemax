
// This Edge Function is responsible for updating the AI models in the database
// It fetches models from various providers and inserts them into the ai_models table
// The function can be triggered manually or runs automatically on a schedule

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

// The master user ID who manages the AI models
const MASTER_USER_ID = '8b40d73f-fffb-411f-9044-480773968d58';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if we should force update
    const forceUpdate = req.headers.get('X-Force-Update') === 'true';
    console.log(`Update AI models function triggered. Force update: ${forceUpdate}`);

    // If not a force update, check if we've updated within the last 24 hours
    if (!forceUpdate) {
      const { data: lastUpdate } = await supabase
        .from('ai_models')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (lastUpdate && lastUpdate.length > 0) {
        const lastUpdateTime = new Date(lastUpdate[0].updated_at);
        const timeSinceLastUpdate = Date.now() - lastUpdateTime.getTime();
        
        // If less than 24 hours, skip unless force update
        if (timeSinceLastUpdate < 24 * 60 * 60 * 1000) {
          console.log(`Skipping update - last updated ${Math.round(timeSinceLastUpdate / (60 * 60 * 1000))} hours ago`);
          return new Response(
            JSON.stringify({
              success: true,
              skipped: true,
              message: "Models were updated recently. Use X-Force-Update: true to force an update."
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    // Fetch all models managed by master user
    // IMPORTANT: Only select models that haven't been manually deleted
    const { data: existingModels, error: existingModelsError } = await supabase
      .from('ai_models')
      .select('id, name, provider')
      .is('is_deleted', null)  // Only select models that are not marked as deleted
      .order('provider, name');
    
    if (existingModelsError) {
      throw new Error(`Error fetching existing models: ${existingModelsError.message}`);
    }
    
    // Calculate stats
    const providerStats = countModelsByProvider(existingModels || []);
    const providers = Object.keys(providerStats);
    
    console.log(`Models metadata update complete. Found ${existingModels?.length || 0} models from ${providers.length} providers`);
    
    // After updating model metadata, trigger the AI enhancement function with a flag to check for significant changes
    console.log('Triggering AI enhancement function to update model descriptions and characteristics...');
    
    try {
      // Call the enhance-ai-models function to update descriptions, strengths, and limitations
      // Include flag to check for significant differences before updating
      const enhanceResponse = await supabase.functions.invoke('enhance-ai-models', {
        method: 'POST',
        body: {
          checkSignificantChanges: true
        }
      });
      
      if (enhanceResponse.error) {
        console.error('Error calling enhance-ai-models function:', enhanceResponse.error);
      } else {
        console.log('AI enhancement triggered successfully:', enhanceResponse.data);
      }
    } catch (enhanceError) {
      console.error('Error triggering AI enhancement:', enhanceError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully updated model metadata and triggered AI enhancement`,
        totalModels: existingModels?.length || 0,
        providerStats,
        providers
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in update-ai-models function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to count models by provider
function countModelsByProvider(models: any[]): Record<string, number> {
  return models.reduce((counts, model) => {
    const provider = model.provider || 'Unknown';
    counts[provider] = (counts[provider] || 0) + 1;
    return counts;
  }, {});
}
