
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
    
    // Create a prefix for the system message that instructs the AI to create a finalized prompt
    // This is crucial to ensure we get a usable prompt, not instructions
    const systemPrefix = `You are creating a FINALIZED PROMPT that will be directly used in another AI system. DO NOT give instructions on how to create a prompt - instead, generate the actual prompt itself that is ready to be used.

IMPORTANT: Your output must be the final prompt text itself, not instructions or explanations about the prompt.

START YOUR PROMPT WITH A 4-6 WORD TITLE AS A MARKDOWN H1 HEADING, BUT WITHOUT THE # CHARACTER. For example, instead of "# Dog Image Generator", use "Dog Image Generator". This title should be concise and capture the essence of the prompt.

IF THE TEMPLATE HAS PILLARS, FORMAT EACH PILLAR TITLE AS A MARKDOWN H2 HEADING, BUT WITHOUT THE ## CHARACTER. For example, use "Task" instead of "## Task". Each pillar should be its own separate section of the prompt.`;
    
    // Use the template's role with our prefix
    let systemMessage = systemPrefix;
    
    // Add the template's role if available
    if (template?.role) {
      systemMessage += `\n\n${template.role}`;
    } else {
      systemMessage += `\n\nYou are a helpful assistant.`;
    }
    
    // Add toggle information to the system message if available
    if (primaryToggle) {
      systemMessage += `\n\nFocus area: ${primaryToggle}`;
    }
    if (secondaryToggle) {
      systemMessage += `\nSecondary focus: ${secondaryToggle}`;
    }
    
    // Construct a user message that directly requests content creation
    // Start with the original prompt as the core intent
    let userMessage = `Original intent: ${originalPrompt}`;
    
    // Add context from answered questions if available
    if (context) {
      userMessage += `\n\nAdditional context:\n${context}`;
    }
    
    // If template has pillars, add structured guidance for the content
    if (template && template.pillars && template.pillars.length > 0) {
      userMessage += "\n\nPlease structure your response to include the following sections using the pillars as headings (without ## markdown):";
      
      template.pillars.forEach(pillar => {
        userMessage += `\n- ${pillar.title}: ${pillar.description}`;
      });
      
      userMessage += "\n\nExample format:\nMain Prompt Title\n\nFirst Pillar Title\nContent related to first pillar...\n\nSecond Pillar Title\nContent related to second pillar...";
    }
    
    // Add an explicit instruction to create a finalized prompt
    userMessage += `\n\nIMPORTANT: Generate a FINALIZED PROMPT text that I can directly use with another AI system. DO NOT provide instructions on how to write a prompt or explanations - just give me the prompt itself.`;
    
    userMessage += `\n\nRemember to start with a 4-6 word title that captures the essence of the prompt, without using markdown characters like #.`;
    
    userMessage += `\n\nMake sure the final prompt fully captures and retains the ORIGINAL INTENT from the initial prompt: "${originalPrompt}"`;
    
    if (template && template.pillars && template.pillars.length > 0) {
      userMessage += `\n\nAlso remember to format each pillar title as a simple heading without markdown characters, to create distinct sections in your response.`;
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
        enhancedPrompt: `Error Enhancing Prompt

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
