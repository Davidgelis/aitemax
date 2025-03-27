
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAI } from "https://esm.sh/openai@4.26.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      originalPrompt, 
      answeredQuestions, 
      relevantVariables,
      primaryToggle,
      secondaryToggle,
      userId,
      promptId,
      template  // Template data
    } = await req.json();
    
    // Default values in case no template is provided
    const defaultMaxCharacterLimit = 3000;
    const defaultTemperature = 0.7;
    
    // Extract template information if available
    const maxCharacterLimit = template?.characterLimit || defaultMaxCharacterLimit;
    const temperature = template?.temperature || defaultTemperature;
    
    console.log(`Enhancing prompt with focus on ${primaryToggle || "no specific toggle"}`);
    console.log(`Using template: ${template ? template.name : "default"}`);
    console.log(`Character limit: ${maxCharacterLimit}`);
    console.log(`Temperature: ${temperature}`);
    console.log(`Original prompt: "${originalPrompt.substring(0, 100)}..."`);

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openAIApiKey
    });

    // Prepare context from answered questions
    const context = answeredQuestions
      .filter(q => q.answer && q.answer.trim() !== "")
      .map(q => `${q.text}\nAnswer: ${q.answer}`).join("\n\n");
    
    // Use the template's role directly as the system message
    // This is the key change - we're no longer telling the AI to act as a prompt engineer
    let systemMessage = template?.role || "You are a helpful assistant.";
    
    // Add toggle information to the system message if available
    if (primaryToggle) {
      systemMessage += `\n\nFocus area: ${primaryToggle}`;
    }
    if (secondaryToggle) {
      systemMessage += `\nSecondary focus: ${secondaryToggle}`;
    }
    
    // Construct a user message that directly requests content creation
    // Instead of asking to enhance a prompt, we're asking to create content
    let userMessage = originalPrompt;
    
    // Add context from answered questions if available
    if (context) {
      userMessage += `\n\nAdditional context:\n${context}`;
    }
    
    // If template has pillars, add structured guidance for the content
    if (template && template.pillars && template.pillars.length > 0) {
      userMessage += "\n\nPlease structure your response to include:";
      
      template.pillars.forEach(pillar => {
        userMessage += `\n- ${pillar.title}: ${pillar.description}`;
      });
    }
    
    userMessage += `\n\nPlease limit your response to ${maxCharacterLimit} characters.`;
    
    // Create the messages array for the API call
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage }
    ];

    try {
      // Make the API call
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        temperature: temperature  // Use the template's temperature or default
      });

      const enhancedPrompt = completion.choices[0].message.content;
      
      return new Response(JSON.stringify({ 
        enhancedPrompt,
        loadingMessage: `Enhancing prompt${primaryToggle ? ` for ${primaryToggle}` : ''}...`,
        usage: completion.usage || { prompt_tokens: 0, completion_tokens: 0 }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openaiError) {
      console.error("Error calling OpenAI API:", openaiError);
      
      // Return a structured error response
      return new Response(JSON.stringify({
        error: openaiError.message,
        enhancedPrompt: `# Error Enhancing Prompt

We encountered an error while trying to enhance your prompt. Please try again.

Original Prompt:
${originalPrompt}`,
        loadingMessage: "Error enhancing prompt..."
      }), {
        status: 200, // Keep 200 to avoid edge function errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Error in enhance-prompt function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      enhancedPrompt: "Error: Could not process the prompt enhancement request.",
      loadingMessage: "Error processing request..." 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
