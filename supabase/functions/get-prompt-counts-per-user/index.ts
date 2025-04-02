
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.9.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define model pricing constants (per 1000 tokens)
const MODEL_PRICING = {
  'gpt-4o': {
    promptCostPerThousandTokens: 2.50,  // $2.50 per 1000 tokens
    completionCostPerThousandTokens: 10.00  // $10.00 per 1000 tokens
  },
  'o3-mini': {
    promptCostPerThousandTokens: 1.10,  // $1.10 per 1000 tokens
    completionCostPerThousandTokens: 4.40  // $4.40 per 1000 tokens
  },
  'gpt-3.5-turbo': {
    promptCostPerThousandTokens: 1.50, // $1.50 per 1000 tokens
    completionCostPerThousandTokens: 2.00 // $2.00 per 1000 tokens
  },
  // Default pricing for any other models
  'default': {
    promptCostPerThousandTokens: 2.50,
    completionCostPerThousandTokens: 10.00
  }
}

// Calculate cost based on model and token usage
const calculateModelCost = (model: string, promptTokens: number, completionTokens: number) => {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING.default
  
  // Convert raw token counts to thousands and calculate costs
  const promptTokensInThousands = promptTokens / 1000
  const completionTokensInThousands = completionTokens / 1000
  
  const promptCost = promptTokensInThousands * pricing.promptCostPerThousandTokens
  const completionCost = completionTokensInThousands * pricing.completionCostPerThousandTokens
  
  return {
    promptCost,
    completionCost,
    totalCost: promptCost + completionCost
  }
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
    
    console.log('Fetching prompt counts and usage stats per user...')

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
    
    // Get detailed token usage data (for cost calculation)
    const { data: tokenData, error: tokenError } = await supabase
      .from('token_usage')
      .select('user_id, model, prompt_tokens, completion_tokens')
    
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
              model_usage: {},
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
              model_usage: {},
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
              model_usage: {},
              total_cost: 0
            }
          }
          userStats[item.user_id].drafts_count += 1
          userStats[item.user_id].total_count += 1
        }
      })
    }
    
    // Process token usage and calculate costs by model
    if (tokenData && Array.isArray(tokenData)) {
      tokenData.forEach(item => {
        if (item.user_id) {
          if (!userStats[item.user_id]) {
            userStats[item.user_id] = { 
              prompts_count: 0, 
              drafts_count: 0, 
              total_count: 0,
              model_usage: {},
              total_cost: 0
            }
          }
          
          // Initialize model_usage entry if it doesn't exist
          const modelName = item.model || 'unknown'
          if (!userStats[item.user_id].model_usage[modelName]) {
            userStats[item.user_id].model_usage[modelName] = {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
              prompt_cost: 0,
              completion_cost: 0,
              total_cost: 0,
              usage_count: 0
            }
          }
          
          // Add to token counts (using raw token counts)
          const promptTokens = item.prompt_tokens || 0
          const completionTokens = item.completion_tokens || 0
          
          userStats[item.user_id].model_usage[modelName].prompt_tokens += promptTokens
          userStats[item.user_id].model_usage[modelName].completion_tokens += completionTokens
          userStats[item.user_id].model_usage[modelName].total_tokens += (promptTokens + completionTokens)
          userStats[item.user_id].model_usage[modelName].usage_count += 1
          
          // Calculate costs using the updated calculation function
          const costs = calculateModelCost(modelName, promptTokens, completionTokens)
          
          userStats[item.user_id].model_usage[modelName].prompt_cost += costs.promptCost
          userStats[item.user_id].model_usage[modelName].completion_cost += costs.completionCost
          userStats[item.user_id].model_usage[modelName].total_cost += costs.totalCost
          
          // Add to user's total cost
          userStats[item.user_id].total_cost += costs.totalCost
        }
      })
    }
    
    // Convert to expected format with model-specific data
    const formattedData = Object.entries(userStats).map(([user_id, stats]) => {
      const userData = {
        user_id,
        prompts_count: stats.prompts_count,
        drafts_count: stats.drafts_count,
        total_count: stats.total_count,
        total_cost: Number(stats.total_cost.toFixed(6)),
        model_usage: stats.model_usage,
        total_prompt_tokens: 0,
        total_completion_tokens: 0,
        total_tokens: 0
      }
      
      // Calculate token totals across all models
      for (const [_, modelStats] of Object.entries(stats.model_usage)) {
        userData.total_prompt_tokens += modelStats.prompt_tokens
        userData.total_completion_tokens += modelStats.completion_tokens
        userData.total_tokens += modelStats.total_tokens
      }
      
      return userData
    })

    console.log(`Successfully fetched user stats: ${formattedData.length} users found`)
    
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
