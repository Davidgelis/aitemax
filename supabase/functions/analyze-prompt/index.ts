
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSystemPrompt } from './system-prompt.ts';
import { extractQuestions, extractVariables, extractMasterCommand, extractEnhancedPrompt } from './utils/extractors.ts';
import { analyzePromptWithAI } from './openai-client.ts';
import { generateContextQuestionsForPrompt, generateContextualVariablesForPrompt } from './utils/generators.ts';

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
      smartContextData,
      model = 'gpt-4o' // Default to gpt-4o if not specified
    } = await req.json();
    
    console.log("Starting analyze-prompt with:", {
      promptLength: promptText?.length,
      hasImageData: !!imageData,
      hasSmartContext: !!smartContextData?.context,
      hasWebsiteData: !!websiteData?.url,
      templateName: template?.name || 'none',
      templatePillars: template?.pillars?.length || 0,
      model
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
        // Strip data URL prefix if present
        imageBase64 = imageData[0].base64.replace(/^data:image\/[a-z]+;base64,/, '');
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
      imageBase64,
      model // Pass the model parameter to the API call
    );

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error("Failed to parse content:", error);
      throw new Error(`Invalid response format: ${error.message}`);
    }

    // Extract or generate questions based on the AI response and template
    let questions;
    if (Array.isArray(parsedContent?.questions) && parsedContent.questions.length > 0) {
      questions = extractQuestions(content, enhancedContext);
    } else {
      console.log("No questions in AI response, generating from template");
      questions = generateContextQuestionsForPrompt(enhancedContext, template);
    }
    
    // Extract or generate variables based on the AI response and template
    let variables;
    if (Array.isArray(parsedContent?.variables) && parsedContent.variables.length > 0) {
      variables = extractVariables(content, enhancedContext);
    } else {
      console.log("No variables in AI response, generating from template");
      variables = generateContextualVariablesForPrompt(enhancedContext, template);
    }
    
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
          imageProcessingStatus: imageBase64 ? "processed" : "not available",
          model,
          templateUsed: template?.name || "none",
          pillarsCount: template?.pillars?.length || 0
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
