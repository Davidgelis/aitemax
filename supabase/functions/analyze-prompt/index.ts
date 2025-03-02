
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.1";

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
    const { promptText, primaryToggle, secondaryToggle } = await req.json();

    if (!promptText) {
      throw new Error('Prompt text is required');
    }

    console.log("Analyzing prompt:", { promptText, primaryToggle, secondaryToggle });

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    // Construct system message based on toggles
    let systemMessage = "You are an expert AI prompt analyst that can analyze prompts and provide feedback.";
    
    if (primaryToggle === "complex") {
      systemMessage += " Focus on evaluating complex reasoning aspects.";
    } else if (primaryToggle === "math") {
      systemMessage += " Focus on mathematical problem-solving aspects.";
    } else if (primaryToggle === "coding") {
      systemMessage += " Focus on code generation and programming aspects.";
    } else if (primaryToggle === "copilot") {
      systemMessage += " Focus on evaluating how well the prompt works for creating an AI assistant.";
    }

    if (secondaryToggle === "token") {
      systemMessage += " Emphasize token efficiency in your analysis.";
    } else if (secondaryToggle === "strict") {
      systemMessage += " Emphasize strict response formats in your analysis.";
    } else if (secondaryToggle === "creative") {
      systemMessage += " Emphasize creative potential in your analysis.";
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: `Analyze this prompt and provide detailed feedback:\n\n${promptText}` }
      ],
      temperature: 0.7,
      function_call: "auto",
      functions: [
        {
          name: "prompt_analysis",
          description: "Analyze a prompt and provide structured feedback",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                description: "List of questions to ask the user to improve the prompt",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                    isRelevant: { type: "boolean", default: true },
                  },
                  required: ["id", "text"]
                }
              },
              variables: {
                type: "array",
                description: "List of variables detected in the prompt",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    value: { type: "string" },
                    isRelevant: { type: "boolean", default: true },
                  },
                  required: ["id", "name"]
                }
              },
              masterCommand: {
                type: "string",
                description: "A suggested master command to adapt the prompt to other similar needs"
              },
              enhancedPrompt: {
                type: "string",
                description: "An enhanced version of the original prompt"
              }
            },
            required: ["questions", "variables", "masterCommand", "enhancedPrompt"]
          }
        }
      ]
    });

    const functionCall = response.choices[0].message.function_call;
    
    if (functionCall && functionCall.name === "prompt_analysis") {
      const analysisResult = JSON.parse(functionCall.arguments);
      console.log("Analysis complete - returning results");
      
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error("Function call response not received");
    }

  } catch (error) {
    console.error("Error in analyze-prompt function:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message || "An error occurred during prompt analysis" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
