
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAI } from "https://esm.sh/openai@4.26.0";

/**
 * Sends a prompt for analysis to OpenAI API
 */
export async function analyzePromptWithAI(
  promptText: string, 
  systemMessage: string, 
  apiKey: string,
  additionalContext: string = "",
  imageBase64?: string
): Promise<any> {
  if (!promptText || typeof promptText !== 'string') {
    console.error("Invalid prompt text:", promptText);
    throw new Error("Invalid prompt text provided");
  }

  if (!apiKey) {
    console.error("Missing API key");
    throw new Error("OpenAI API key is required");
  }
  
  const messages = [
    { 
      role: 'system', 
      content: `You are an expert prompt analyzer. Your task is to analyze prompts and identify key questions and variables. You must return a valid JSON object containing:
      {
        "questions": [{"id": "string", "text": "string", "answer": "string", "category": "string"}],
        "variables": [{"id": "string", "name": "string", "value": "string", "category": "string"}],
        "masterCommand": "string",
        "enhancedPrompt": "string"
      }
      
      Guidelines:
      - Each question must have a unique ID
      - Questions should help gather missing context
      - Variables should capture key customizable elements
      - Keep answers and values concise and specific
      - Do not reference images/websites directly in answers
      
      ${systemMessage}`
    }
  ];
  
  // If we have an image, create a message with content parts
  if (imageBase64) {
    console.log("Image provided for analysis - adding to message array");
    
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: `Analyze this prompt: "${promptText}" ${additionalContext}`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ]
    });
  } else {
    messages.push({
      role: 'user',
      content: `Analyze this prompt: "${promptText}" ${additionalContext}`
    });
  }
  
  try {
    console.log("Calling OpenAI API with messages:", JSON.stringify(messages, null, 2));
    
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      temperature: 0.7,
    });
    
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error("Invalid response from OpenAI API:", response);
      throw new Error("Invalid response format from OpenAI API");
    }
    
    const content = response.choices[0].message.content;
    console.log("Raw OpenAI response:", content);
    
    // Try to parse the response as JSON
    try {
      const parsedContent = JSON.parse(content);
      console.log("Successfully parsed response as JSON:", parsedContent);
      return {
        content: parsedContent,
        usage: response.usage
      };
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      throw new Error("Failed to parse OpenAI response as JSON");
    }
    
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
