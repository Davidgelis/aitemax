
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
    console.log("Starting analyze-prompt function");
    
    const requestBody = await req.json();
    const { 
      promptText, 
      primaryToggle, 
      secondaryToggle, 
      template,
      websiteData,
      imageData,
      smartContextData,
      model = 'gpt-4o'
    } = requestBody;
    
    console.log("Request received with:", {
      promptLength: promptText?.length,
      hasImageData: !!imageData,
      imageDataLength: imageData?.length,
      hasSmartContext: !!smartContextData?.context,
      hasWebsiteData: !!websiteData?.url,
      templateName: template?.name || 'none',
      templatePillars: template?.pillars?.length || 0,
      model
    });

    if (!promptText?.trim()) {
      throw new Error("Prompt text is required");
    }
    
    // Check if prompt is too short/simple for questions
    const isPromptSimple = promptText.length < 50 || promptText.split(' ').length < 10;
    console.log(`Prompt simplicity check: ${isPromptSimple ? 'Simple prompt' : 'Complex prompt'}`);

    // Enhanced image data validation
    let hasValidImageData = false;
    if (Array.isArray(imageData) && imageData.length > 0) {
      hasValidImageData = imageData.some(img => img && img.base64 && img.context);
      console.log(`Image data validation: ${hasValidImageData ? 'Valid' : 'Invalid'}, Images with context: ${imageData.filter(img => img.context).length}`);
    }

    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    
    // Build the enhanced context
    let enhancedContext = promptText;
    let imageBase64 = null;
    let imageContext = '';
    
    // Enhanced image processing with better logging
    if (imageData) {
      console.log("Processing image data with validation");
      
      if (Array.isArray(imageData) && imageData.length > 0 && imageData[0]?.base64) {
        imageBase64 = imageData[0].base64.replace(/^data:image\/[a-z]+;base64,/, '');
        imageContext = imageData[0].context || '';
        enhancedContext = `${enhancedContext}\n\nIMAGE CONTEXT: ${imageContext}`;
        console.log("Successfully processed image data:", {
          hasBase64: !!imageBase64,
          hasContext: !!imageContext,
          contextLength: imageContext.length
        });
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

    console.log("Calling OpenAI API for analysis");
    
    const { content } = await analyzePromptWithAI(
      enhancedContext,
      systemPrompt,
      apiKey,
      smartContextData?.context || '',
      imageBase64,
      model
    );

    console.log("Received response from OpenAI, parsing content");

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
      console.log("Successfully parsed JSON response", {
        hasImageAnalysis: !!parsedContent.imageAnalysis,
        hasQuestions: !!parsedContent.questions
      });
    } catch (error) {
      console.error("Failed to parse content:", error);
      throw new Error(`Invalid response format: ${error.message}`);
    }

    // Generate questions based on context, now prioritizing images
    let questions = [];
    
    // If we have valid image data, always generate questions
    if (hasValidImageData) {
      console.log("Generating questions based on image data");
      if (template && template.pillars && Array.isArray(template.pillars) && template.pillars.length > 0) {
        questions = generateContextQuestionsForPrompt(enhancedContext, template, smartContextData, parsedContent?.imageAnalysis);
      } else {
        // Even without a template, generate image-specific questions
        questions = generateContextQuestionsForPrompt(enhancedContext, null, smartContextData, parsedContent?.imageAnalysis);
      }
      console.log(`Generated ${questions.length} questions with image data`);
    } else if (!isPromptSimple) {
      // For complex prompts without images, use regular question generation
      console.log("Generating questions for complex prompt");
      if (template && template.pillars && Array.isArray(template.pillars) && template.pillars.length > 0) {
        questions = generateContextQuestionsForPrompt(enhancedContext, template, smartContextData, null);
      } else if (Array.isArray(parsedContent?.questions)) {
        questions = extractQuestions(content, enhancedContext);
      }
      console.log(`Generated ${questions.length} questions for complex prompt`);
    } else {
      console.log("Skipping question generation for simple prompt without image");
    }
    
    // Always generate variables with appropriate complexity
    let variables = generateContextualVariablesForPrompt(
      enhancedContext,
      template,
      parsedContent?.imageAnalysis,
      smartContextData,
      isPromptSimple && !hasValidImageData // Flag for concise variables
    );

    const masterCommand = extractMasterCommand(content);
    const enhancedPrompt = extractEnhancedPrompt(content);

    console.log("Analysis complete, returning results:", {
      questionsCount: questions.length,
      variablesCount: variables.length,
      hasMasterCommand: !!masterCommand,
      hasEnhancedPrompt: !!enhancedPrompt,
      isPromptSimple,
      hasValidImageData
    });

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
          pillarsCount: template?.pillars?.length || 0,
          isPromptSimple,
          hasValidImageData,
          imageAnalysisAvailable: !!parsedContent?.imageAnalysis
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
