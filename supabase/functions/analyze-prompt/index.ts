
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSystemPrompt } from './system-prompt.ts';
import { extractQuestions, extractVariables, extractMasterCommand, extractEnhancedPrompt } from './utils/extractors.ts';

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
      backgroundInfo
    } = await req.json();
    
    console.log("Received prompt analysis request:", {
      promptLength: promptText?.length || 0,
      hasPrimaryToggle: !!primaryToggle,
      hasSecondaryToggle: !!secondaryToggle,
      hasTemplate: !!template,
      templateType: template?.isDefault ? 'Default Framework' : 'Custom Template',
      templateId: template?.id || 'none',
      templateName: template?.name,
      hasBackgroundInfo: !!backgroundInfo,
      templatePillars: template?.pillars?.length || 0
    });

    // Validate template structure if provided
    if (template && (!template.id || !template.name || !Array.isArray(template.pillars))) {
      throw new Error("Invalid template structure provided");
    }

    // Create system prompt with template
    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    
    // Validate OpenAI API key
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    // Call OpenAI API with template context
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: "system", 
            content: systemPrompt 
          },
          { 
            role: "user", 
            content: promptText,
            ...(backgroundInfo && { background: backgroundInfo })
          }
        ],
        temperature: template?.temperature || 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message?.content || '';
    
    // Extract components with template awareness
    console.log("Extracting components with template context...");
    const questions = extractQuestions(aiResponse, promptText);
    const variables = extractVariables(aiResponse, promptText);
    const masterCommand = extractMasterCommand(aiResponse);
    const enhancedPrompt = extractEnhancedPrompt(aiResponse);

    console.log("Analysis complete:", {
      questionsCount: questions.length,
      variablesCount: variables.length,
      hasMasterCommand: !!masterCommand,
      hasEnhancedPrompt: !!enhancedPrompt,
      templateUsed: template?.name || 'None',
      pillarsFound: [...new Set(questions.map(q => q.category))]
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
          type: template.isDefault ? 'Default Framework' : 'Custom Template',
          pillarsUsed: template.pillars.length
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
