
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSystemPrompt } from './system-prompt.ts';
import { extractQuestions, extractVariables, extractMasterCommand, extractEnhancedPrompt } from './utils/extractors.ts';
import { analyzePromptWithAI } from './openai-client.ts';

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
    const { 
      promptText, 
      primaryToggle, 
      secondaryToggle, 
      template,
      websiteData,
      imageData,
      smartContextData
    } = await req.json();
    
    console.log("Analyzing prompt with:", {
      promptLength: promptText?.length || 0,
      hasTemplate: !!template,
      hasImageData: !!imageData,
      hasSmartContext: !!smartContextData,
      templateName: template?.name || 'none'
    });

    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    
    // Build enhanced context
    let additionalContext = "";
    
    if (imageData) {
      console.log("Processing image data for analysis");
      additionalContext += `\nIMAGE ANALYSIS CONTEXT:\n${imageData.instructions || 'Analyze all relevant aspects.'}\n\n`;
    }
    
    if (smartContextData) {
      console.log("Processing smart context data");
      additionalContext += `\nSMART CONTEXT:\n${smartContextData.context}\nUsage Instructions: ${smartContextData.usageInstructions}\n\n`;
    }
    
    if (websiteData) {
      console.log("Processing website data");
      additionalContext += `\nWEBSITE CONTEXT:\n${websiteData.content}\nInstructions: ${websiteData.instructions}\n\n`;
    }
    
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    console.log("Calling OpenAI API for analysis...");
    const { content, usage } = await analyzePromptWithAI(
      promptText,
      systemPrompt,
      apiKey,
      additionalContext,
      imageData?.base64
    );

    console.log("Extracting components from AI response");
    const questions = extractQuestions(content, promptText);
    console.log("Extracted questions count:", questions.length);
    console.log("Questions with pre-filled answers:", 
      questions.filter(q => q.answer).length);

    const variables = extractVariables(content, promptText);
    const masterCommand = extractMasterCommand(content);
    const enhancedPrompt = extractEnhancedPrompt(content);

    return new Response(
      JSON.stringify({
        questions,
        variables,
        masterCommand,
        enhancedPrompt,
        templateInfo: template ? {
          id: template.id,
          name: template.name,
          type: template.isDefault ? 'Default Framework' : 'Custom Template'
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
