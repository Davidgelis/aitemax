
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.9.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get API keys from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Create Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Fetching prompt counts per user...')

    // Query to get count of prompts per user
    const { data, error } = await supabase
      .from('token_usage')
      .select('user_id, count(*)')
      .group('user_id')
    
    if (error) {
      console.error('Error fetching prompt counts:', error)
      throw error
    }

    console.log('Successfully fetched prompt counts')
    
    // Format the data to match the expected structure
    const formattedData = data.map(item => ({
      user_id: item.user_id,
      count: item.count.toString()
    }))

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in edge function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
