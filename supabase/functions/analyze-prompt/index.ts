
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAI } from "https://esm.sh/openai@4.26.0";
import { validateQuestionVariablePairs } from "./utils/validators.ts";
import { extractQuestions, extractVariables } from "./utils/extractors.ts";
import { createSystemPrompt } from "./system-prompt.ts";

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
      promptText,
      primaryToggle,
      secondaryToggle,
      userId,
      promptId,
      websiteData,
      imageData,
      smartContextData,
      inputTypes,
      model
    } = await req.json();

    console.log("analyze-prompt called with:", {
      promptText: promptText ? `${promptText.substring(0, 50)}...` : "empty",
      hasImages: !!imageData && Array.isArray(imageData) && imageData.length > 0,
      hasWebsiteContext: !!websiteData && !!websiteData.url,
      hasSmartContext: !!smartContextData && !!smartContextData.context,
      inputTypes,
      uploadedImagesCount: imageData?.length || 0,
      model
    });

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openAIApiKey
    });

    // Build messages array for the OpenAI API
    const messages = [];

    // Add system message with improved context
    const systemMessage = createSystemPrompt(primaryToggle, secondaryToggle);
    messages.push({ role: "system", content: systemMessage });

    // Add user message with comprehensive context
    let userMessage = `Analyze the following prompt:\n${promptText}\n\n`;

    if (websiteData && websiteData.url) {
      userMessage += `Website context: ${websiteData.url}. Instructions: ${websiteData.instructions}\n\n`;
    }

    if (imageData && Array.isArray(imageData) && imageData.length > 0) {
      userMessage += `Image data: ${JSON.stringify(imageData)}\n\n`;
    }

    if (smartContextData && smartContextData.context) {
      userMessage += `Smart context: ${smartContextData.context}. Usage: ${smartContextData.usageInstructions}\n\n`;
    }

    messages.push({ role: "user", content: userMessage });

    console.log("Sending request to OpenAI with system message length:", systemMessage.length);
    console.log("User message length:", userMessage.length);
    console.log("Using model:", model || "gpt-4o-mini");

    const completion = await openai.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    console.log("Raw OpenAI response:", content);

    let parsedData;
    try {
      parsedData = JSON.parse(content);
      console.log("Successfully parsed OpenAI response");
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      throw new Error("Invalid response format from OpenAI");
    }

    // Validate the response structure
    if (!parsedData || typeof parsedData !== 'object') {
      console.error("Invalid response structure:", parsedData);
      throw new Error("Invalid response structure");
    }

    // Extract and validate questions and variables
    const questions = extractQuestions(content, promptText);
    const variables = extractVariables(content, promptText);

    // Validate question-variable pairs
    if (!validateQuestionVariablePairs(questions, variables)) {
      console.error("Question-variable validation failed");
      throw new Error("Invalid question-variable structure");
    }

    console.log("Final response prepared:", {
      questionCount: questions.length,
      variableCount: variables.length,
      masterCommand: parsedData.masterCommand || "",
      enhancedPromptLength: (parsedData.enhancedPrompt || "").length
    });

    return new Response(
      JSON.stringify({
        questions,
        variables,
        masterCommand: parsedData.masterCommand || "",
        enhancedPrompt: parsedData.enhancedPrompt || "",
        usage: completion.usage
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-prompt function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
