
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
    
    console.log("Received prompt analysis request:", {
      promptLength: promptText?.length || 0,
      hasPrimaryToggle: !!primaryToggle,
      hasSecondaryToggle: !!secondaryToggle,
      hasTemplate: !!template,
      templateName: template?.name || 'none',
      templatePillarsCount: template?.pillars?.length || 0,
      hasWebsiteData: !!websiteData,
      hasImageData: !!imageData,
      hasSmartContext: !!smartContextData
    });

    // Create system prompt with template
    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    
    // Log the first 200 characters of the system prompt to help with debugging
    console.log("System prompt excerpt:", systemPrompt.substring(0, 200) + "...");
    
    // Enhanced context building with better structure
    let additionalContext = "";
    
    if (imageData) {
      additionalContext += `\nIMAGE ANALYSIS CONTEXT:\nInstructions: ${imageData.instructions || 'Analyze all relevant aspects of the image.'}\n\n`;
    }
    
    if (websiteData) {
      additionalContext += `\nWEBSITE CONTEXT:\n${websiteData.content}\nExtraction Instructions: ${websiteData.instructions}\n\n`;
    }
    
    if (smartContextData) {
      additionalContext += `\nSMART CONTEXT DATA:\n${smartContextData.context}\nUsage Requirements: ${smartContextData.usageInstructions}\n\n`;
    }
    
    // Validate OpenAI API key
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    // Call OpenAI API with enhanced context
    const { content, usage } = await analyzePromptWithAI(
      promptText,
      systemPrompt,
      apiKey,
      additionalContext,
      imageData?.base64
    );

    console.log("Extracting components from AI response...");
    const questions = extractQuestions(content, promptText);
    const variables = extractVariables(content, promptText);
    const masterCommand = extractMasterCommand(content);
    const enhancedPrompt = extractEnhancedPrompt(content);

    console.log("Analysis complete:", {
      questionsCount: questions.length,
      variablesCount: variables.length,
      preFilledQuestions: questions.filter(q => q.answer).length,
      preFilledVariables: variables.filter(v => v.value).length,
      pillarsRepresented: [...new Set(questions.map(q => q.category))].join(', ')
    });

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
