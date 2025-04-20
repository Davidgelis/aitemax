
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
    let imageBase64 = null;
    let imageContext = '';
    
    // Process image data with enhanced validation and logging
    if (imageData) {
      console.log("Processing image data:", {
        isArray: Array.isArray(imageData),
        hasFirstItem: Array.isArray(imageData) && imageData.length > 0,
        firstItemHasBase64: Array.isArray(imageData) && imageData.length > 0 && !!imageData[0]?.base64
      });
      
      // Handle both single image object and array formats
      if (Array.isArray(imageData) && imageData.length > 0) {
        // Use the first image if it's an array
        if (imageData[0]?.base64) {
          imageBase64 = imageData[0].base64;
          imageContext = imageData[0].context || 'Analyze all visible elements to enhance the prompt.';
          console.log("Using first image from array with base64 length:", imageBase64.length);
        }
      } else if (imageData.base64) {
        // Direct image object
        imageBase64 = imageData.base64;
        imageContext = imageData.context || 'Analyze all visible elements to enhance the prompt.';
        console.log("Using direct image object with base64 length:", imageBase64.length);
      }
      
      if (imageBase64) {
        // Clean base64 string if needed
        if (imageBase64.includes(',')) {
          imageBase64 = imageBase64.split(',')[1];
          console.log("Cleaned up base64 string by removing data URL prefix");
        }
        
        console.log("Image data prepared for analysis:", {
          base64Length: imageBase64.length,
          contextLength: imageContext.length
        });
        
        // Add image context to prompt if available
        enhancedContext = `${enhancedContext}\n\nIMAGE CONTEXT: ${imageContext}`;
      } else {
        console.warn("Image data was provided but no valid base64 content found");
      }
    }
    
    // Add smart context if available
    if (smartContextData?.context) {
      console.log("Adding smart context data:", {
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

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    console.log("Calling analyzePromptWithAI with:", {
      promptTextLength: enhancedContext.length,
      hasSmartContext: !!smartContextData?.context,
      hasImageBase64: !!imageBase64,
      imageBase64Length: imageBase64 ? imageBase64.length : 0
    });

    const { content } = await analyzePromptWithAI(
      enhancedContext,
      systemPrompt,
      apiKey,
      smartContextData?.context || "",
      imageBase64
    );

    console.log("Processing AI response with context-aware extraction");
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
      console.log("Successfully parsed response:", {
        questionsCount: parsedContent.questions?.length || 0,
        preFilledCount: parsedContent.questions?.filter(q => q.answer?.startsWith("PRE-FILLED:")).length || 0,
        imagePreFilledCount: parsedContent.questions?.filter(q => 
          q.answer?.startsWith("PRE-FILLED:") && 
          (q.answer?.includes("(from image analysis)") || q.contextSource === "image")
        ).length || 0,
        hasVariables: !!parsedContent.variables,
        hasMasterCommand: !!parsedContent.masterCommand,
        hasEnhancedPrompt: !!parsedContent.enhancedPrompt
      });
    } catch (error) {
      console.error("Failed to parse content:", error);
      throw new Error(`Invalid response format: ${error.message}`);
    }

    const questions = extractQuestions(content, enhancedContext);
    const imageBasedQuestions = questions.filter(q => 
      q.answer?.includes("(from image analysis)") || q.answer?.includes("image")
    );
    
    console.log(`Extracted ${questions.length} questions with pre-filled answers:`, {
      preFilledTotal: questions.filter(q => q.answer && q.answer.startsWith("PRE-FILLED:")).length,
      imageBasedCount: imageBasedQuestions.length,
      imageQuestions: imageBasedQuestions.map(q => ({id: q.id, text: q.text.substring(0, 30)}))
    });
    
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
        } : null,
        // Include debugging info about image processing in development
        debug: {
          hasImageData: !!imageBase64,
          imageProcessingStatus: imageBase64 ? "processed" : "not available",
          imagePreFilledCount: imageBasedQuestions.length
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
