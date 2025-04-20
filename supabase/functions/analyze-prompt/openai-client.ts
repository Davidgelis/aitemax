
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

export async function analyzePromptWithAI(
  promptText: string, 
  systemMessage: string, 
  apiKey: string,
  smartContext: string = "",
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

  // Initialize structured context with validated data
  let structuredContext = {
    imageAnalysis: null,
    smartContext: smartContext, // Fix: Properly assign smart context
    promptText
  };
  
  // Process image if available with enhanced validation
  if (imageBase64) {
    try {
      // Clean base64 string if needed
      if (imageBase64.includes(',')) {
        imageBase64 = imageBase64.split(',')[1];
      }

      // Validate base64 format
      imageBase64 = imageBase64.replace(/\s/g, '');
      if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
        throw new Error("Invalid base64 format");
      }
      
      // Use a single API call with both the image and text
      console.log("Sending integrated analysis request");
      
      const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Using consistent model identifier
          messages: [
            {
              role: 'system',
              content: `${systemMessage}

VARIABLE EXTRACTION AND PREFILLING RULES:
1. Only extract variables when they are EXPLICITLY mentioned in the prompt text or clearly visible in image data
2. Create variables ONLY for concrete values that can be directly extracted, not for concepts or themes
3. Pre-fill variables ONLY when you have high confidence (>90%) about their values
4. Format all variables consistently with user-friendly names and clear values
5. IMPORTANT: Do not create variables for abstract concepts or uncertain values`
            },
            {
              role: 'user',
              content: [
                {
                  type: "text",
                  text: `Analyze this prompt: ${promptText}${smartContext ? `\n\nAdditional context: ${smartContext}` : ''}`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          temperature: 0.5,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error(`Analysis failed: ${analysisResponse.status}`);
      }

      const data = await analysisResponse.json();
      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
      
    } catch (error) {
      console.error("Error in image analysis:", error.message);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  } else {
    // Text-only analysis
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: `Analyze this prompt: ${promptText}${smartContext ? `\n\nAdditional context: ${smartContext}` : ''}` }
          ],
          temperature: 0.5,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        }),
      });
  
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
  
      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      console.error("Error in analyzePromptWithAI:", error.message);
      throw error;
    }
  }
}
