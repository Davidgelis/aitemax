
import { Question, Variable } from "./types.ts";

interface AnalyzePromptResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function analyzePromptWithAI(
  promptText: string,
  systemPrompt: string,
  model: string = 'gpt-4o-mini',
  websiteData: any = null,
  imageData: any[] = [],
  smartContextData: any = null
): Promise<AnalyzePromptResponse> {
  try {
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      throw new Error("OpenAI API key not found");
    }

    const messages = [];

    // Add system prompt
    messages.push({
      role: "system",
      content: systemPrompt
    });

    // Add context data from various sources if available
    let contentToAnalyze = promptText;

    // Add website context if available
    if (websiteData && websiteData.content) {
      messages.push({
        role: "user",
        content: `Website content context:\n${websiteData.content}\n\nUser's instructions for the website context: ${websiteData.instructions || "No specific instructions provided"}`
      });
    }

    // Add smart context if available
    if (smartContextData && smartContextData.context) {
      messages.push({
        role: "user",
        content: `Additional context:\n${smartContextData.context}\n\nUser's instructions for this context: ${smartContextData.usageInstructions || "No specific instructions provided"}`
      });
    }

    // Process image data if available
    let imageContent = [];
    if (imageData && imageData.length > 0) {
      // First, log information about the images
      console.log(`Processing ${imageData.length} images for analysis`);
      
      imageData.forEach((img, idx) => {
        if (img.base64) {
          const context = img.context ? `Context: ${img.context}` : "No specific context provided";
          imageContent.push({
            type: "image_url",
            image_url: {
              url: img.base64,
            }
          });
          
          console.log(`Image ${idx+1}: Base64 data available, length: ${img.base64.length}, context: ${context.substring(0, 50)}...`);
        } else {
          console.log(`Image ${idx+1}: No base64 data available`);
        }
      });
    }
    
    // Add the main prompt as user message
    if (imageContent.length > 0) {
      // For prompts with images, we need to use a multipart message
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: contentToAnalyze
          },
          ...imageContent
        ]
      });
    } else {
      // For regular text prompts
      messages.push({
        role: "user",
        content: contentToAnalyze
      });
    }

    // Log details of what we're sending to OpenAI
    console.log(`Processing prompt with length: ${contentToAnalyze.length} characters`);
    console.log(`Using OpenAI model: ${model}`);
    console.log(`Final content length being sent to OpenAI: ${contentToAnalyze.length} characters`);

    // Make OpenAI API call
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenAI API error (${response.status}): ${errorData}\n`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response content returned from OpenAI");
    }

    const result = {
      content: data.choices[0].message.content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined
    };

    return result;
  } catch (error) {
    console.error("Error in analyzePromptWithAI:", error);
    throw error;
  }
}
