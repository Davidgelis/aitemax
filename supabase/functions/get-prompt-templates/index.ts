
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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
    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;

    if (authHeader) {
      // Initialize Supabase client
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Verify the JWT and get user data
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error("Auth error:", error.message);
        throw error;
      }
      
      if (user) {
        userId = user.id;
      }
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get templates that are either default or belong to the user
    // The RLS policies will handle this, but we're adding an explicit filter for clarity
    let query = supabase
      .from('prompt_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('title');

    if (userId) {
      query = query.or(`is_default.eq.true,user_id.eq.${userId}`);
    } else {
      query = query.eq('is_default', true);
    }

    const { data: templates, error } = await query;

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ templates }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in get-prompt-templates function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      templates: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
