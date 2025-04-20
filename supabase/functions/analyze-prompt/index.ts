
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

    // Validate template structure
    if (!template || !template.pillars || !Array.isArray(template.pillars) || template.pillars.length === 0) {
      console.log("Warning: Invalid or missing template structure", template);
    } else {
      console.log(`Template has ${template.pillars.length} pillars:`, 
        template.pillars.map((p: any) => p.title || "Unnamed").join(", "));
    }

    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    
    // Build the enhanced context
    let enhancedContext = promptText;
    let imageBase64 = null;
    let imageContext = '';
    
    // Process image data with enhanced validation
    if (imageData) {
      console.log("Processing image data");
      
      if (Array.isArray(imageData) && imageData.length > 0 && imageData[0]?.base64) {
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
      console.log("Successfully parsed JSON response");
    } catch (error) {
      console.error("Failed to parse content:", error);
      throw new Error(`Invalid response format: ${error.message}`);
    }

    // For simple prompts, ONLY generate variables, not questions
    let questions = [];
    if (!isPromptSimple && template && template.pillars && Array.isArray(template.pillars) && template.pillars.length > 0) {
      console.log("Generating questions from template pillars");
      questions = generateContextQuestionsForPrompt(enhancedContext, template, smartContextData, parsedContent?.imageAnalysis);
      console.log(`Generated ${questions.length} questions from template pillars`);
    } 
    // Only use AI-generated questions for complex prompts and as fallback
    else if (!isPromptSimple && Array.isArray(parsedContent?.questions) && parsedContent.questions.length > 0) {
      console.log("Using AI-generated questions as fallback");
      questions = extractQuestions(content, enhancedContext);
    } else {
      console.log("Simple prompt or no template - not generating questions");
      questions = [];
    }
    
    // Always generate variables, with single word answers for simple prompts
    let variables = [];
    if (isPromptSimple) {
      console.log("Simple prompt detected - generating concise single-word variables");
      // For simple prompts, generate more concise variables with single-word values
      variables = generateContextualVariablesForPrompt(
        enhancedContext,
        template,
        parsedContent?.imageAnalysis || null,
        smartContextData,
        true // Flag to indicate we want concise, single-word variables
      );
    } else if (Array.isArray(parsedContent?.variables) && parsedContent.variables.length > 0) {
      console.log("Extracting variables from AI response");
      variables = extractVariables(content, enhancedContext);
    } else {
      console.log("Generating variables from context");
      variables = generateContextualVariablesForPrompt(
        enhancedContext,
        template,
        parsedContent?.imageAnalysis || null,
        smartContextData
      );
    }
    
    const masterCommand = extractMasterCommand(content);
    const enhancedPrompt = extractEnhancedPrompt(content);

    console.log("Analysis complete, returning results:", {
      questionsCount: questions.length,
      variablesCount: variables.length,
      hasMasterCommand: !!masterCommand,
      hasEnhancedPrompt: !!enhancedPrompt
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
          isPromptSimple
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
