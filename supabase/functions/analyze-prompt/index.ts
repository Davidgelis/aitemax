
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSystemPrompt } from "./system-prompt.ts";
import { analyzePromptWithAI } from "./openai-client.ts";
import { generateContextQuestionsForPrompt, generateContextualVariablesForPrompt } from "./utils/generators.ts";

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
    const { 
      promptText, 
      template, 
      websiteData, 
      imageData, 
      smartContextData, 
      model = 'gpt-4o' 
    } = await req.json();

    if (!promptText?.trim()) {
      throw new Error("Prompt text is required");
    }

    // Generate system prompt based on template
    const systemPrompt = createSystemPrompt(template);

    // Build enhanced context
    let enhancedContext = promptText;
    let imageBase64 = null;

    if (imageData?.[0]?.base64) {
      imageBase64 = imageData[0].base64.replace(/^data:image\/[a-z]+;base64,/, '');
      enhancedContext = `${enhancedContext}\n\nIMAGE CONTEXT: ${imageData[0].context || ''}`;
    }

    if (websiteData?.url) {
      enhancedContext = `${enhancedContext}\n\nWEBSITE CONTEXT:\nURL: ${websiteData.url}\n${websiteData.instructions || ''}`;
    }

    if (smartContextData?.context) {
      enhancedContext = `${enhancedContext}\n\nADDITIONAL CONTEXT:\n${smartContextData.context}`;
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    // Get AI analysis
    const { content } = await analyzePromptWithAI(
      enhancedContext,
      systemPrompt,
      apiKey,
      smartContextData?.context || '',
      imageBase64,
      model
    );

    // Parse and validate response
    const parsed = JSON.parse(content);

    // Ensure questions array exists
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

    // Track question categories and identify missing pillars
    const categoryCounts = questions.reduce((acc, q) => ({
      ...acc,
      [q.category]: (acc[q.category] || 0) + 1
    }), {} as Record<string, number>);

    // Get all pillar titles from template
    const pillarTitles = Array.isArray(template?.pillars) 
      ? template.pillars.map((p: any) => p.title)
      : [];

    // Find which pillars have no questions
    const missingPillars = pillarTitles.filter(title => !categoryCounts[title]);

    // Process variables
    const variables = Array.isArray(parsed.variables) ? parsed.variables : [];

    // Return enhanced response with debug info
    return new Response(JSON.stringify({
      questions,
      variables,
      masterCommand: parsed.masterCommand || '',
      enhancedPrompt: parsed.enhancedPrompt || '',
      debug: {
        hasImageData: !!imageBase64,
        model,
        missingPillars,
        pillarCoverage: {
          total: pillarTitles.length,
          covered: pillarTitles.length - missingPillars.length,
          missing: missingPillars.length
        },
        categories: Object.keys(categoryCounts),
        categoryDistribution: categoryCounts
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        questions: [],
        variables: [],
        masterCommand: "",
        enhancedPrompt: ""
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
