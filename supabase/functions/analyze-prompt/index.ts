
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
        try {
          imageBase64 = imageData[0].base64.replace(/^data:image\/[a-z]+;base64,/, '');
          imageContext = imageData[0].context || '';
          enhancedContext = `${enhancedContext}\n\nIMAGE CONTEXT: ${imageContext}`;
          console.log("Successfully processed image data:", {
            hasBase64: !!imageBase64,
            base64Length: imageBase64 ? imageBase64.length : 0,
            hasContext: !!imageContext,
            contextLength: imageContext.length
          });
        } catch (imageErr) {
          console.error("Error processing image:", imageErr);
          imageBase64 = null;
          imageContext = '';
        }
      } else {
        console.log("Image data validation failed:", {
          isArray: Array.isArray(imageData),
          length: Array.isArray(imageData) ? imageData.length : 0,
          firstItemHasBase64: Array.isArray(imageData) && imageData.length > 0 ? !!imageData[0]?.base64 : false
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
        imageAnalysisFields: parsedContent.imageAnalysis ? Object.keys(parsedContent.imageAnalysis).join(", ") : "none",
        hasQuestions: !!parsedContent.questions
      });
    } catch (error) {
      console.error("Failed to parse content:", error);
      // Provide fallback content when parsing fails
      parsedContent = {
        questions: [],
        variables: [],
        masterCommand: "",
        enhancedPrompt: enhancedContext,
        error: error.message
      };
    }

    // Check if we need to use fallback questions
    let questions = [];
    const useAIQuestions = Array.isArray(parsedContent?.questions) && parsedContent.questions.length > 0;
    
    if (useAIQuestions) {
      // Check if the questions are focused on intent rather than just pillars
      const directPillarQuestions = parsedContent.questions.filter(q => 
        q.text.includes("regarding") && template?.pillars?.some(p => q.text.includes(p.title))
      );
      
      // If there are no direct pillar questions or the ratio is acceptable, use AI questions
      if (directPillarQuestions.length === 0 || directPillarQuestions.length < parsedContent.questions.length / 2) {
        console.log("Using AI-generated questions that focus on user intent");
        questions = parsedContent.questions;
      } else {
        // Otherwise, generate our own intent-focused questions
        console.log("Generating intent-focused questions as fallback");
        questions = generateContextQuestionsForPrompt(enhancedContext, template, smartContextData, parsedContent?.imageAnalysis);
      }
    } else if (hasValidImageData && parsedContent?.imageAnalysis) {
      // For image analysis with valid data, generate questions based on the image
      console.log("Generating questions based on image analysis");
      questions = generateContextQuestionsForPrompt(enhancedContext, template, smartContextData, parsedContent.imageAnalysis);
    } else if (!isPromptSimple) {
      // For complex prompts without images, generate intent-focused questions
      console.log("Generating intent-focused questions for complex prompt");
      questions = generateContextQuestionsForPrompt(enhancedContext, template, smartContextData, null);
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
      hasValidImageData,
      imageAnalysisAvailable: !!parsedContent?.imageAnalysis
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
    
    // Return a more graceful error response
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        questions: [],
        variables: [],
        masterCommand: "",
        enhancedPrompt: ""
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
