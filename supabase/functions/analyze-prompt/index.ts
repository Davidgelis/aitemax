
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
      hasImageData: !!imageData?.base64,
      hasSmartContext: !!smartContextData?.context,
      hasWebsiteData: !!websiteData?.url,
      primaryToggle,
      secondaryToggle,
      templateId: template?.id
    });

    if (!promptText?.trim()) {
      throw new Error("Prompt text is required");
    }

    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    
    // Build the enhanced context by combining all available contexts
    let enhancedContext = promptText;
    let imageContext = '';
    
    // Process image data first for context enhancement
    if (imageData?.base64) {
      console.log("Processing image data...");
      imageContext = `Analyze this image using the provided context instructions:\n${imageData.context || 'Analyze all visible elements to enhance the prompt.'}`
    }
    
    // Add smart context if available
    if (smartContextData?.context) {
      console.log("Adding smart context:", {
        contextLength: smartContextData.context.length,
        hasInstructions: !!smartContextData.usageInstructions
      });
      
      enhancedContext = `${enhancedContext}\n\nADDITIONAL CONTEXT:\n${smartContextData.context}`;
      
      if (smartContextData.usageInstructions) {
        enhancedContext += `\n\nUSAGE INSTRUCTIONS:\n${smartContextData.usageInstructions}`;
      }
    }
    
    // Add website context if available
    if (websiteData?.url) {
      console.log("Adding website context from:", websiteData.url);
      enhancedContext = `${enhancedContext}\n\nWEBSITE CONTEXT:\nURL: ${websiteData.url}\n${websiteData.instructions || ''}`;
    }
    
    console.log("Final enhanced context length:", enhancedContext.length);
    
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const { content } = await analyzePromptWithAI(
      enhancedContext,
      systemPrompt,
      apiKey,
      smartContextData?.context || "",
      imageData?.base64
    );

    console.log("Analyzing AI response and extracting components");
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
      console.log("Successfully parsed content:", {
        hasQuestions: !!parsedContent.questions,
        questionsCount: parsedContent.questions?.length || 0,
        hasVariables: !!parsedContent.variables,
        hasMasterCommand: !!parsedContent.masterCommand,
        hasEnhancedPrompt: !!parsedContent.enhancedPrompt
      });
    } catch (error) {
      console.error("Failed to parse content:", error);
      throw new Error("Invalid response format");
    }
    
    const questions = extractQuestions(content, enhancedContext);
    console.log(`Extracted ${questions.length} questions with prefilled answers:`, 
      questions.filter(q => q.answer && q.answer.startsWith("PRE-FILLED:")).length);
    
    const variables = extractVariables(content, enhancedContext);
    console.log(`Extracted ${variables.length} variables with values:`, 
      variables.filter(v => v.value).length);
    
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
