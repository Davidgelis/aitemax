
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
    
    console.log("Starting analyze-prompt with:", {
      promptLength: promptText?.length,
      hasImageData: !!imageData,
      hasSmartContext: !!smartContextData?.context,
      hasWebsiteData: !!websiteData?.url
    });

    if (!promptText?.trim()) {
      throw new Error("Prompt text is required");
    }

    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    
    // Build the enhanced context by combining all available contexts
    let enhancedContext = promptText;
    let imageBase64 = null;
    let imageContext = '';
    
    // Process image data with enhanced validation
    if (imageData) {
      console.log("Processing image data");
      
      if (Array.isArray(imageData) && imageData.length > 0 && imageData[0]?.base64) {
        imageBase64 = imageData[0].base64;
        imageContext = imageData[0].context || '';
        enhancedContext = `${enhancedContext}\n\nIMAGE CONTEXT: ${imageContext}`;
      }
    }
    
    // Add smart context if available
    if (smartContextData?.context) {
      enhancedContext = `${enhancedContext}\n\nADDITIONAL CONTEXT:\n${smartContextData.context}`;
    }
    
    // Add website context if available
    if (websiteData?.url) {
      enhancedContext = `${enhancedContext}\n\nWEBSITE CONTEXT:\nURL: ${websiteData.url}\n${websiteData.instructions || ''}`;
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const { content } = await analyzePromptWithAI(
      enhancedContext,
      systemPrompt,
      apiKey,
      smartContextData?.context || "",
      imageBase64
    );

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error("Failed to parse content:", error);
      throw new Error(`Invalid response format: ${error.message}`);
    }

    const questions = extractQuestions(content, enhancedContext);
    const variables = extractVariables(content, enhancedContext);
    const masterCommand = extractMasterCommand(content);
    const enhancedPrompt = extractEnhancedPrompt(content);

    return new Response(
      JSON.stringify({
        questions,
        variables,
        masterCommand,
        enhancedPrompt,
        debug: {
          hasImageData: !!imageBase64,
          imageProcessingStatus: imageBase64 ? "processed" : "not available"
        }
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
