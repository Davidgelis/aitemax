
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

    // Call OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: promptText }
      ],
    });

    const aiResponse = completion.data.choices[0].message?.content || '';
    console.log("AI Response received:", aiResponse.substring(0, 200) + "...");

    // Extract and validate the questions
    const questions = extractQuestions(aiResponse, promptText);
    console.log("Extracted questions:", questions.length, "questions");
    console.log("Question categories:", [...new Set(questions.map(q => q.category))]);

    // Extract other components
    const variables = extractVariables(aiResponse, promptText);
    const masterCommand = extractMasterCommand(aiResponse);
    const enhancedPrompt = extractEnhancedPrompt(aiResponse);

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
    console.error('Error in analyze-prompt function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
