
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSystemPrompt } from './system-prompt.ts';
import { extractQuestions, extractVariables, extractMasterCommand, extractEnhancedPrompt } from './utils/extractors.ts';
import { analyzePromptWithAI } from './openai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
    
    console.log("Processing analyze-prompt request:", {
      promptLength: promptText?.length || 0,
      hasTemplate: !!template,
      hasImageData: !!imageData,
      hasSmartContext: !!smartContextData
    });

    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    let additionalContext = "";
    
    if (websiteData) {
      console.log("Adding website context");
      additionalContext += `\nWEBSITE CONTENT:\n${websiteData.content}\n`;
    }
    
    if (smartContextData) {
      console.log("Adding smart context");
      additionalContext += `\nSMART CONTEXT:\n${smartContextData.context}\n`;
    }
    
    if (imageData) {
      console.log("Adding image context");
      additionalContext += `\nIMAGE CONTEXT:\n${imageData.instructions || ''}\n`;
    }
    
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const { content } = await analyzePromptWithAI(
      promptText,
      systemPrompt,
      apiKey,
      additionalContext,
      imageData?.base64
    );

    console.log("Extracting components from AI response");
    const questions = extractQuestions(content, promptText);
    console.log(`Extracted ${questions.length} questions`);
    
    const variables = extractVariables(content, promptText);
    console.log(`Extracted ${variables.length} variables`);
    
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
