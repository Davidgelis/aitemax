
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

    // Query to get count of prompts per user - use an actual count operation
    const { data, error } = await supabase
      .from('token_usage')
      .select('user_id')
      .is('prompt_id', null, { not: true }) // Only count rows with a valid prompt_id
      .gt('step', 0) // Ensure step is greater than 0 to count only valid prompts
    
    if (error) {
      console.error('Error fetching prompt data:', error)
      throw error
    }

    // Manual count to ensure accuracy
    const userCounts = {}
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        if (item.user_id) {
          userCounts[item.user_id] = (userCounts[item.user_id] || 0) + 1
        }
      })
    }
    
    // Convert to expected format
    const formattedData = Object.entries(userCounts).map(([user_id, count]) => ({
      user_id,
      count: count.toString()
    }))

    console.log(`Successfully fetched prompt counts: ${JSON.stringify(formattedData)}`)
    
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
