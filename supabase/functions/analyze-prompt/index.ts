
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
      hasSmartContext: !!smartContextData,
      smartContextLength: smartContextData?.context?.length || 0,
      hasImageData: !!imageData,
    });

    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    
    // Build the enhanced context by combining all available contexts
    let enhancedContext = promptText || '';
    
    if (smartContextData?.context) {
      console.log("Processing smart context:", {
        contextLength: smartContextData.context.length,
        usageInstructions: smartContextData.usageInstructions
      });
      
      // Combine the smart context with the original prompt
      enhancedContext = `${enhancedContext}\n\nADDITIONAL CONTEXT:\n${smartContextData.context}`;
      
      if (smartContextData.usageInstructions) {
        enhancedContext += `\n\nUSAGE INSTRUCTIONS:\n${smartContextData.usageInstructions}`;
      }
      
      console.log("Combined context length:", enhancedContext.length);
    }
    
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const { content } = await analyzePromptWithAI(
      enhancedContext,
      systemPrompt,
      apiKey,
      smartContextData?.context || "",  // Pass smart context separately for special handling
      imageData?.base64
    );

    console.log("Analyzing AI response and extracting components");
    
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
