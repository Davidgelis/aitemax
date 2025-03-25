import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { 
      originalPrompt, 
      answeredQuestions, 
      relevantVariables, 
      primaryToggle, 
      secondaryToggle, 
      userId,
      promptId,
      selectedTemplate 
    } = await req.json();

    // Validate inputs
    if (!originalPrompt) {
      throw new Error('Missing required field: originalPrompt');
    }

    console.log("Enhancing prompt with template:", selectedTemplate?.title || "No template");

    // Extract model parameters (use template values if available)
    let model = "gpt-4o-mini";
    let temperature = 0.7;
    let maxTokens = 2000;
    let systemPrompt = `You are an expert prompt engineer that transforms input prompts into highly effective, well-structured prompts.`;
    
    // Apply template settings if available
    if (selectedTemplate) {
      if (selectedTemplate.temperature !== undefined) {
        temperature = selectedTemplate.temperature;
      }
      
      if (selectedTemplate.maxChars) {
        // Approximate token count (about 4 chars per token)
        maxTokens = Math.floor(selectedTemplate.maxChars / 4);
      }
      
      if (selectedTemplate.systemPrefix) {
        systemPrompt = selectedTemplate.systemPrefix;
      }
    }

    // Prepare variables for API call
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables.');
    }

    // Construct the prompt differently based on whether a template is provided
    let prompt = '';
    
    if (selectedTemplate && selectedTemplate.pillars && selectedTemplate.pillars.length > 0) {
      // Template-based prompt
      prompt = `I need you to enhance the following prompt into a well-structured format using these sections:\n\n`;
      
      selectedTemplate.pillars.forEach(pillar => {
        prompt += `${pillar.name}: ${pillar.content}\n`;
      });
      
      prompt += `\nOriginal prompt: "${originalPrompt}"\n\n`;
      
      if (primaryToggle) {
        prompt += `This prompt should be optimized for ${primaryToggle}.\n`;
      }
      
      if (secondaryToggle) {
        prompt += `Additionally, the prompt should emphasize ${secondaryToggle}.\n`;
      }
      
      prompt += `\nPlease structure the enhanced prompt using the sections above. For each section, provide specific, clear content that improves upon the original prompt.`;
    } else {
      // Default four-pillar framework if no template
      prompt = `I need you to enhance the following prompt into a well-structured format using the four-pillar framework:\n\n`;
      prompt += `Task: Define the specific job or action to be performed.\n`;
      prompt += `Persona: Specify who the AI should embody or what role it should assume.\n`;
      prompt += `Conditions: Set parameters, constraints, and context for the task.\n`;
      prompt += `Instructions: Provide step-by-step guidance on how to accomplish the task.\n\n`;
      prompt += `Original prompt: "${originalPrompt}"\n\n`;
      
      if (primaryToggle) {
        prompt += `This prompt should be optimized for ${primaryToggle}.\n`;
      }
      
      if (secondaryToggle) {
        prompt += `Additionally, the prompt should emphasize ${secondaryToggle}.\n`;
      }
      
      prompt += `\nPlease structure the enhanced prompt using the four pillars. For each pillar, provide specific, clear content that improves upon the original prompt.`;
    }
    
    // Elaborate on the prompt with questions and variables
    if (answeredQuestions && answeredQuestions.length > 0) {
      prompt += `\n\nAlso, consider these questions and answers:\n`;
      answeredQuestions.forEach((q: { text: any; answer: any; }) => {
        prompt += `Question: ${q.text}\nAnswer: ${q.answer}\n`;
      });
    }

    if (relevantVariables && relevantVariables.length > 0) {
      prompt += `\n\nIncorporate these variables into the prompt:\n`;
      relevantVariables.forEach((v: { name: any; value: any; }) => {
        prompt += `${v.name}: ${v.value}\n`;
      });
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      }),
    });

    // Check for successful response
    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API request failed with status ${response.status}: ${response.statusText}`);
    }

    // Extract the enhanced prompt from the response
    const json = await response.json();
    const enhancedPrompt = json.choices[0].message.content;

    // Return the enhanced prompt
    return new Response(
      JSON.stringify({ 
        enhancedPrompt: enhancedPrompt.trim(),
        loadingMessage: null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
