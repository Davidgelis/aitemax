
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
}

// Get Supabase client with service role key (admin privileges)
const getServiceSupabase = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    if (req.method === 'POST') {
      const { promptText, primaryToggle, secondaryToggle } = await req.json()

      if (!promptText) {
        throw new Error('Missing prompt text')
      }

      console.log('Analyzing prompt:', { promptText, primaryToggle, secondaryToggle })

      // Create a system message that instructs the AI how to interpret the user's prompt
      const systemMessage = {
        "role": "system",
        "content": `You are an advanced prompt analyzer and enhancer that specializes in identifying key elements in user prompts and suggesting improvements.
        
        Your primary task is to analyze the user's prompt and extract TWO simple questions for each pillar (TASK, PERSONA, CONDITIONS, INSTRUCTIONS) along with 1-2 variables per pillar that could be used as placeholders in the final prompt.
        
        Follow these guidelines:
        
        1. QUESTIONS: 
          - Create TWO simple, easy-to-understand questions for each pillar (8 total)
          - Write questions for beginners, not experts
          - Use simple, clear language without jargon
          - Each question should be direct and focus on one aspect only
          - Questions should help clarify the prompt's intent
        
        2. VARIABLES:
          - Identify 1-2 variables per pillar (up to 8 total)
          - Variables should be single words or short compound terms (like "BookTitle", "EmailRecipient", "DeadlineDate")
          - Variables are placeholders that can be replaced without changing the overall context
          - Examples: names, dates, locations, titles, counts, etc.
          - DO NOT include complex phrases or sentences as variables
        
        3. MASTER COMMAND:
          - Create a concise, one-sentence summary of what the prompt is trying to achieve
        
        4. ENHANCED PROMPT:
          - Create an improved version of the user's prompt using the four-pillar framework
          - Format it with clear sections for Task, Persona, Conditions, and Instructions
          - Include placeholders for variables using {{VariableName}} format
        
        Return your analysis in this JSON format:
        {
          "questions": [
            {"id": "q1", "text": "Simple question 1?", "category": "Task"},
            {"id": "q2", "text": "Simple question 2?", "category": "Task"},
            etc...
          ],
          "variables": [
            {"id": "v1", "name": "VariableName1", "category": "Task"},
            {"id": "v2", "name": "VariableName2", "category": "Persona"},
            etc...
          ],
          "masterCommand": "One-sentence summary of the prompt's goal",
          "enhancedPrompt": "Formatted enhanced prompt with {{variables}} as placeholders"
        }`
      }

      const userMessage = {
        "role": "user",
        "content": promptText
      }

      // Add context about the primary toggle if selected
      let toggleContext = ""
      if (primaryToggle) {
        switch(primaryToggle) {
          case 'complex':
            toggleContext += "This prompt should be optimized for complex reasoning tasks. "
            break
          case 'math':
            toggleContext += "This prompt should be optimized for mathematical problem-solving. "
            break
          case 'coding':
            toggleContext += "This prompt should be optimized for generating or explaining code. "
            break
          case 'copilot':
            toggleContext += "This prompt should be optimized for creating an AI assistant or copilot. "
            break
        }
      }

      // Add context about the secondary toggle if selected
      if (secondaryToggle) {
        switch(secondaryToggle) {
          case 'token':
            toggleContext += "The response should be optimized for token efficiency. "
            break
          case 'strict':
            toggleContext += "The response should follow extremely strict guidelines. "
            break
          case 'creative':
            toggleContext += "The response should prioritize creativity. "
            break
        }
      }

      // If we have toggle context, add it to the messages
      const messages = toggleContext 
        ? [systemMessage, userMessage, { "role": "user", "content": toggleContext }]
        : [systemMessage, userMessage]

      // Make a request to OpenAI's API for analysis
      const apiKey = Deno.env.get('OPENAI_API_KEY')
      if (!apiKey) {
        throw new Error('Missing OpenAI API key')
      }

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1500
        })
      })

      if (!openAIResponse.ok) {
        const errorText = await openAIResponse.text()
        console.error('OpenAI API error:', errorText)
        throw new Error(`OpenAI API error: ${openAIResponse.status} ${errorText}`)
      }

      const openAIData = await openAIResponse.json()
      console.log('OpenAI response received')

      // Extract the analysis from the AI's response
      let analysis = {}
      try {
        // Parse the JSON response from the AI
        const content = openAIData.choices[0].message.content
        analysis = JSON.parse(content)
        console.log('Analysis extracted successfully')
      } catch (error) {
        console.error('Error parsing AI response:', error)
        throw new Error('Failed to parse AI analysis')
      }

      // Return the analysis with CORS headers
      return new Response(
        JSON.stringify(analysis),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
