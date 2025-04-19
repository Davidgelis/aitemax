
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSystemPrompt } from './system-prompt.ts';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1';
import { extractQuestions, extractVariables, extractMasterCommand, extractEnhancedPrompt } from './utils/extractors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { promptText, primaryToggle, secondaryToggle, template } = await req.json();
    console.log("Received prompt analysis request:", {
      promptLength: promptText?.length || 0,
      hasPrimaryToggle: !!primaryToggle,
      hasSecondaryToggle: !!secondaryToggle,
      hasTemplate: !!template
    });

    // Validate template structure if provided
    if (template) {
      console.log("Template received:", {
        name: template.name,
        pillarsCount: template.pillars?.length || 0
      });

      if (!template.pillars || !Array.isArray(template.pillars)) {
        throw new Error("Invalid template structure: pillars array is missing");
      }

      template.pillars.forEach((pillar: any, index: number) => {
        if (!pillar.title || !pillar.description) {
          throw new Error(`Invalid pillar at index ${index}: missing title or description`);
        }
      });
    }

    // Create system prompt with validated template
    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    console.log("System prompt created, length:", systemPrompt.length);

    // Validate OpenAI API key
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error("OpenAI API key is missing");
      throw new Error("OpenAI API key is not configured");
    }

    // Call OpenAI
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    const openai = new OpenAIApi(configuration);

    console.log("Calling OpenAI API with gpt-4.1 model...");
    const completion = await openai.createChatCompletion({
      model: 'gpt-4.1',
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: promptText }
      ],
    });

    const aiResponse = completion.data.choices[0].message?.content || '';
    console.log("AI Response received, length:", aiResponse.length);
    console.log("First 200 chars of response:", aiResponse.substring(0, 200));

    // Extract and validate components
    const questions = extractQuestions(aiResponse, promptText);
    const variables = extractVariables(aiResponse, promptText);
    const masterCommand = extractMasterCommand(aiResponse);
    const enhancedPrompt = extractEnhancedPrompt(aiResponse);

    console.log("Analysis complete:", {
      questionsCount: questions.length,
      variablesCount: variables.length,
      hasMasterCommand: !!masterCommand,
      hasEnhancedPrompt: !!enhancedPrompt,
    });

    return new Response(
      JSON.stringify({
        questions,
        variables,
        masterCommand,
        enhancedPrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Detailed error in analyze-prompt function:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.name,
        details: error.cause
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
