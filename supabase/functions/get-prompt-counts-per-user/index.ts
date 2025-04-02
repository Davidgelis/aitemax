
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

    // Get completed prompts (non-drafts from prompts table)
    const { data: completedPromptsData, error: completedError } = await supabase
      .from('prompts')
      .select('user_id, id')
      .eq('is_draft', false)
    
    if (completedError) {
      console.error('Error fetching completed prompts:', completedError)
      throw completedError
    }
    
    // Get drafts from prompt_drafts table
    const { data: draftsData, error: draftsError } = await supabase
      .from('prompt_drafts')
      .select('user_id, id')
    
    if (draftsError) {
      console.error('Error fetching drafts:', draftsError)
      throw draftsError
    }
    
    // Get drafts from prompts table (is_draft = true)
    const { data: promptDraftsData, error: promptDraftsError } = await supabase
      .from('prompts')
      .select('user_id, id')
      .eq('is_draft', true)
    
    if (promptDraftsError) {
      console.error('Error fetching prompt drafts:', promptDraftsError)
      throw promptDraftsError
    }
    
    // Get token usage data (for cost calculation)
    const { data: tokenData, error: tokenError } = await supabase
      .from('token_usage')
      .select('user_id, total_cost')
    
    if (tokenError) {
      console.error('Error fetching token data:', tokenError)
      throw tokenError
    }

    // Count prompts and drafts per user
    const userStats = {}
    
    // Process completed prompts
    if (completedPromptsData && Array.isArray(completedPromptsData)) {
      completedPromptsData.forEach(item => {
        if (item.user_id) {
          if (!userStats[item.user_id]) {
            userStats[item.user_id] = { 
              prompts_count: 0, 
              drafts_count: 0, 
              total_count: 0,
              total_cost: 0
            }
          }
          userStats[item.user_id].prompts_count += 1
          userStats[item.user_id].total_count += 1
        }
      })
    }
    
    // Process drafts from prompt_drafts table
    if (draftsData && Array.isArray(draftsData)) {
      draftsData.forEach(item => {
        if (item.user_id) {
          if (!userStats[item.user_id]) {
            userStats[item.user_id] = { 
              prompts_count: 0, 
              drafts_count: 0, 
              total_count: 0,
              total_cost: 0
            }
          }
          userStats[item.user_id].drafts_count += 1
          userStats[item.user_id].total_count += 1
        }
      })
    }
    
    // Process drafts from prompts table
    if (promptDraftsData && Array.isArray(promptDraftsData)) {
      promptDraftsData.forEach(item => {
        if (item.user_id) {
          if (!userStats[item.user_id]) {
            userStats[item.user_id] = { 
              prompts_count: 0, 
              drafts_count: 0, 
              total_count: 0,
              total_cost: 0
            }
          }
          userStats[item.user_id].drafts_count += 1
          userStats[item.user_id].total_count += 1
        }
      })
    }
    
    // Add token costs
    if (tokenData && Array.isArray(tokenData)) {
      tokenData.forEach(item => {
        if (item.user_id && userStats[item.user_id]) {
          userStats[item.user_id].total_cost += Number(item.total_cost) || 0
        } else if (item.user_id) {
          // Create entry for users who only have token usage but no prompts
          userStats[item.user_id] = { 
            prompts_count: 0, 
            drafts_count: 0, 
            total_count: 0,
            total_cost: Number(item.total_cost) || 0
          }
        }
      })
    }
    
    // Convert to expected format
    const formattedData = Object.entries(userStats).map(([user_id, stats]) => ({
      user_id,
      prompts_count: stats.prompts_count,
      drafts_count: stats.drafts_count,
      total_count: stats.total_count,
      total_cost: stats.total_cost
    }))

    console.log(`Successfully fetched prompt counts: ${formattedData.length} users found`)
    
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
