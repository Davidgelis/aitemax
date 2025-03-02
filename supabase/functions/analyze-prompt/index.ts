
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { promptText, primaryToggle, secondaryToggle } = await req.json();
    
    // Validate input
    if (!promptText || typeof promptText !== 'string') {
      throw new Error('Invalid or missing promptText');
    }

    console.log('Analyzing prompt:', promptText);
    console.log('Primary toggle:', primaryToggle);
    console.log('Secondary toggle:', secondaryToggle);

    // Create system prompt based on the four pillars
    const systemPrompt = `
You are an advanced prompt analyzer and enhancer that specializes in the following four pillars:

1. Task: You will be provided with an input prompt, which may be as brief as two sentences or as extensive as a comprehensive brief. Your job is to enhance this prompt by applying best practices and instructions. Improve clarity, grammar, structure, and logical flow while preserving the original intent.

2. Persona: You assume the role of an advanced scenario generator with expertise in language, prompt engineering, and multi-perspective analysis. You can simulate multiple well-established personas analyzing strategic questions within professional settings.

3. Conditions: When correcting and enhancing prompts, you focus on clear layout and logical sequence; use specific formats; provide abstract examples; organize components logically; validate outputs; ensure cultural awareness; prevent biases; mark missing context; clearly identify data; define ambiguous terms; and include sample outputs when helpful.

4. Instructions: You follow step-by-step guidelines to outline your approach, identify key components for improvement, synthesize analysis into a coherent prompt, finalize it as standalone, and append notes for clarification.

For the provided prompt, analyze it and output:
1. EXACTLY 2 important questions for each of the four pillars (Task, Persona, Conditions, Instructions) that would help improve the prompt. These should be specific questions that require contextual answers.
2. 1-2 variables for each pillar that could be used as placeholders in the enhanced prompt. These should be clear, specific variables that don't require extensive explanation (like names, dates, formats, etc.).
3. A master command that summarizes what the prompt is trying to achieve.
4. An enhanced version of the prompt that incorporates placeholders for the variables.

Your output MUST be valid JSON with this exact structure:
{
  "questions": [
    {"id": "q1", "text": "First question about Task", "category": "Task"},
    {"id": "q2", "text": "Second question about Task", "category": "Task"},
    {"id": "q3", "text": "First question about Persona", "category": "Persona"},
    {"id": "q4", "text": "Second question about Persona", "category": "Persona"},
    {"id": "q5", "text": "First question about Conditions", "category": "Conditions"},
    {"id": "q6", "text": "Second question about Conditions", "category": "Conditions"},
    {"id": "q7", "text": "First question about Instructions", "category": "Instructions"},
    {"id": "q8", "text": "Second question about Instructions", "category": "Instructions"}
  ],
  "variables": [
    {"id": "v1", "name": "VariableName1", "value": "", "category": "Task"},
    {"id": "v2", "name": "VariableName2", "value": "", "category": "Task"},
    {"id": "v3", "name": "VariableName3", "value": "", "category": "Persona"},
    {"id": "v4", "name": "VariableName4", "value": "", "category": "Persona"},
    {"id": "v5", "name": "VariableName5", "value": "", "category": "Conditions"},
    {"id": "v6", "name": "VariableName6", "value": "", "category": "Conditions"},
    {"id": "v7", "name": "VariableName7", "value": "", "category": "Instructions"},
    {"id": "v8", "name": "VariableName8", "value": "", "category": "Instructions"}
  ],
  "masterCommand": "Concise description of what this prompt aims to achieve",
  "enhancedPrompt": "Enhanced prompt with {{VariableName1}}, {{VariableName2}}, etc. as placeholders"
}

Do not include any other text or explanation in your response - only the JSON object.
`;

    // Use OpenAI API to analyze the prompt
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: promptText
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openAiData = await openAiResponse.json();
    console.log('OpenAI response received');
    
    let analysisResult;
    
    try {
      // Parse the content from OpenAI response
      const content = openAiData.choices[0].message.content;
      analysisResult = JSON.parse(content);
      console.log('Successfully parsed analysis result');
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw response:', openAiData.choices[0].message.content);
      throw new Error('Failed to parse AI response');
    }

    // Add any additional processing based on toggles
    if (primaryToggle === 'coding') {
      analysisResult.enhancedPrompt = `# ${analysisResult.masterCommand}\n\n${analysisResult.enhancedPrompt}`;
    }
    
    if (secondaryToggle === 'strict') {
      analysisResult.enhancedPrompt += '\n\nPlease follow these instructions precisely without adding additional information.';
    } else if (secondaryToggle === 'creative') {
      analysisResult.enhancedPrompt += '\n\nFeel free to be creative while addressing the core requirements.';
    } else if (secondaryToggle === 'token') {
      // Simplify the prompt to save tokens
      analysisResult.enhancedPrompt = analysisResult.enhancedPrompt
        .replace(/\n\n/g, '\n')
        .replace(/\s{2,}/g, ' ');
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing request:', error.message);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
