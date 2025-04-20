
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

  // Initialize structured context object with validated data
  let structuredContext = {
    imageAnalysis: null,
    smartContext: null,
    promptText: promptText.slice(0, 4000) // Limit prompt text length
  };
  
  // Process image if available with enhanced validation and error handling
  if (imageBase64) {
    console.log("Starting image analysis with GPT-4.1-2025-04-14...");
    try {
      // Validate and clean base64 string
      if (imageBase64.includes(',')) {
        imageBase64 = imageBase64.split(',')[1];
        console.log("Cleaned base64 string for image analysis");
      }

      // Validate base64 format and strip any whitespace
      imageBase64 = imageBase64.replace(/\s/g, '');
      if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
        throw new Error("Invalid base64 format");
      }
      
      // Determine MIME type based on base64 prefix if available
      let mimeType = "image/jpeg"; // Default
      if (imageBase64.startsWith('/9j/')) {
        mimeType = "image/jpeg";
      } else if (imageBase64.startsWith('iVBOR')) {
        mimeType = "image/png";
      } else if (imageBase64.startsWith('R0lGO')) {
        mimeType = "image/gif";
      } else if (imageBase64.startsWith('UklGR')) {
        mimeType = "image/webp";
      }
      
      // Use a single API call with both the image and text to save time and tokens
      console.log("Sending integrated analysis request to GPT-4.1");
      
      const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14', // Use dated model ID for stability
          messages: [
            {
              role: 'system',
              content: `${systemMessage}

VARIABLE EXTRACTION AND PREFILLING RULES:
1. Only extract variables when they are EXPLICITLY mentioned in the prompt text or clearly visible in image data
2. Create variables ONLY for concrete values that can be directly extracted, not for concepts or themes
3. Pre-fill variables ONLY when you have high confidence (>90%) about their values
4. Format all variables consistently with user-friendly names and clear values
5. IMPORTANT: Do not create variables for abstract concepts or uncertain values
6. VARIABLES OUTPUT FORMAT:
{
  "id": "unique-id",
  "name": "clear-descriptive-name",
  "value": "extracted-concrete-value",
  "isRelevant": true,
  "category": "Category",
  "code": "VAR_X"
}

JSON SCHEMA for response:
{
  "questions": [
    {
      "id": "string",
      "category": "string",
      "text": "string",
      "answer": "string",
      "isRelevant": boolean,
      "contextSource": "string",
      "technicalTerms": [
        {
          "term": "string",
          "explanation": "string",
          "example": "string"
        }
      ]
    }
  ],
  "variables": [
    {
      "id": "string",
      "name": "string",
      "value": "string",
      "isRelevant": boolean,
      "category": "string",
      "code": "string"
    }
  ],
  "masterCommand": "string",
  "enhancedPrompt": "string"
}`
            },
            {
              role: 'user',
              content: [
                {
                  type: "text",
                  text: `Analyze this prompt: ${promptText}${smartContext ? `\n\nAdditional context: ${smartContext}` : ''}`
                },
                ...(imageBase64 ? [{
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`,
                    detail: "high" // Use high detail for better text recognition
                  }
                }] : [])
              ]
            }
          ],
          temperature: 0.5, // Balance between creativity and precision
          max_tokens: 2000, // Generous token limit for full analysis
          response_format: { type: "json_object" }
        }),
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("Analysis failed:", {
          status: analysisResponse.status,
          error: errorText
        });
        throw new Error(`Analysis failed: ${analysisResponse.status}`);
      }

      const analysisData = await analysisResponse.json();
      console.log("Analysis response received");
      
      if (!analysisData.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from analysis");
      }

      try {
        const parsedContent = JSON.parse(analysisData.choices[0].message.content);
        console.log("Successfully parsed analysis:", {
          questionsCount: parsedContent.questions?.length || 0,
          variablesCount: parsedContent.variables?.length || 0,
          hasMasterCommand: !!parsedContent.masterCommand
        });
        
        // Return full analysis directly instead of making a second API call
        return {
          content: analysisData.choices[0].message.content,
          usage: analysisData.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
      } catch (parseError) {
        console.error("Failed to parse analysis JSON:", parseError);
        throw new Error("Invalid analysis response format");
      }
    } catch (error) {
      console.error("Error in analysis:", error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  } else {
    // No image, just process the text prompt
    try {
      console.log("Processing text-only prompt...");
      
      const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14', // Use dated model ID
          messages: [
            { 
              role: 'system', 
              content: `${systemMessage}

VARIABLE EXTRACTION AND PREFILLING RULES:
1. Only extract variables when they are EXPLICITLY mentioned in the prompt text
2. Create variables ONLY for concrete values that can be directly extracted, not for concepts or themes
3. Pre-fill variables ONLY when you have high confidence (>90%) about their values
4. Format all variables consistently with user-friendly names and clear values
5. IMPORTANT: Do not create variables for abstract concepts or uncertain values
6. VARIABLES OUTPUT FORMAT:
{
  "id": "unique-id",
  "name": "clear-descriptive-name",
  "value": "extracted-concrete-value",
  "isRelevant": true,
  "category": "Category",
  "code": "VAR_X"
}

JSON SCHEMA for response:
{
  "questions": [
    {
      "id": "string",
      "category": "string",
      "text": "string",
      "answer": "string",
      "isRelevant": boolean,
      "contextSource": "string",
      "technicalTerms": [
        {
          "term": "string",
          "explanation": "string",
          "example": "string"
        }
      ]
    }
  ],
  "variables": [
    {
      "id": "string",
      "name": "string",
      "value": "string",
      "isRelevant": boolean,
      "category": "string",
      "code": "string"
    }
  ],
  "masterCommand": "string",
  "enhancedPrompt": "string"
}`
            },
            {
              role: 'user',
              content: `Analyze this prompt: ${promptText}${smartContext ? `\n\nAdditional context: ${smartContext}` : ''}`
            }
          ],
          temperature: 0.5,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        }),
      });
  
      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("OpenAI API error:", errorText);
        throw new Error(`OpenAI API error: ${analysisResponse.status}`);
      }
  
      const data = await analysisResponse.json();
      console.log("OpenAI response received");
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from OpenAI");
      }
  
      try {
        // Return the parsed content directly
        return {
          content: data.choices[0].message.content,
          usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", parseError);
        throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`);
      }
    } catch (error) {
      console.error("Error in analyzePromptWithAI:", error);
      throw error;
    }
  }
}
