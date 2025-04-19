
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
    
    console.log("Processing analyze-prompt request with data:", {
      promptLength: promptText?.length || 0,
      hasTemplate: !!template,
      hasWebsiteData: !!websiteData,
      hasSmartContext: !!smartContextData,
      hasImageData: !!imageData,
      smartContextLength: smartContextData?.context?.length || 0
    });

    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    
    // Build the enhanced context string by combining all available contexts
    let enhancedContext = promptText || '';
    let additionalContext = '';
    
    if (smartContextData?.context) {
      console.log("Processing smart context data:", {
        contextLength: smartContextData.context.length,
        hasInstructions: !!smartContextData.usageInstructions
      });
      
      // Add smart context with usage instructions if available
      const smartContextString = `
SMART CONTEXT:
${smartContextData.context}

${smartContextData.usageInstructions ? `USAGE INSTRUCTIONS:
${smartContextData.usageInstructions}` : ''}
`;
      additionalContext += smartContextString;
      console.log("Added smart context to analysis");
    }
    
    if (websiteData?.content) {
      console.log("Adding website context");
      additionalContext += `\nWEBSITE CONTENT:\n${websiteData.content}\n`;
    }
    
    if (imageData) {
      console.log("Adding image context");
      additionalContext += `\nIMAGE CONTEXT:\n${imageData.instructions || ''}\n`;
    }

    console.log("Final context structure:", {
      originalPromptLength: enhancedContext.length,
      additionalContextLength: additionalContext.length,
      hasSmartContext: additionalContext.includes("SMART CONTEXT"),
      hasWebsiteContent: additionalContext.includes("WEBSITE CONTENT"),
      hasImageContext: additionalContext.includes("IMAGE CONTEXT")
    });
    
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const { content } = await analyzePromptWithAI(
      enhancedContext,
      systemPrompt,
      apiKey,
      additionalContext,
      imageData?.base64
    );

    console.log("Analyzing AI response and extracting components");
    const questions = extractQuestions(content, enhancedContext);
    console.log(`Extracted ${questions.length} questions`);
    
    const variables = extractVariables(content, enhancedContext);
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
