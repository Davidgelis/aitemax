
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
    console.log("Starting image analysis with GPT-4.1...");
    try {
      // Validate and clean base64 string
      if (imageBase64.includes(',')) {
        imageBase64 = imageBase64.split(',')[1];
        console.log("Cleaned base64 string for image analysis");
      }

      // Validate base64 format
      if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
        throw new Error("Invalid base64 format");
      }
      
      const imageAnalysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `Analyze this image and extract key information in a concise JSON format. Include:
              {
                "description": "Brief description of the image",
                "subjects": ["Main elements in the image"],
                "style": {"colors": [], "composition": ""},
                "technical": {"quality": "", "lighting": ""},
                "context": "Overall mood and setting",
                "potential_use": ["Suggested applications"]
              }
              Keep responses brief and focused. Return ONLY valid JSON.`
            },
            {
              role: 'user',
              content: [
                {
                  type: "text",
                  text: "Analyze this image:"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
          response_format: { type: "json_object" }
        }),
      });

      if (!imageAnalysisResponse.ok) {
        const errorText = await imageAnalysisResponse.text();
        console.error("Image analysis failed:", {
          status: imageAnalysisResponse.status,
          error: errorText
        });
        throw new Error(`Image analysis failed: ${imageAnalysisResponse.status}`);
      }

      const analysisData = await imageAnalysisResponse.json();
      console.log("Raw image analysis response received");
      
      if (!analysisData.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from image analysis");
      }

      try {
        const parsedContent = JSON.parse(analysisData.choices[0].message.content);
        console.log("Successfully parsed image analysis:", {
          hasDescription: !!parsedContent.description,
          subjectsCount: parsedContent.subjects?.length,
          hasStyle: !!parsedContent.style
        });
        
        structuredContext.imageAnalysis = parsedContent;
      } catch (parseError) {
        console.error("Failed to parse image analysis JSON:", parseError);
        throw new Error("Invalid image analysis response format");
      }
    } catch (error) {
      console.error("Error in image analysis:", error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  try {
    const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemMessage },
          {
            role: 'user',
            content: JSON.stringify({
              prompt: promptText,
              context: {
                imageAnalysis: structuredContext.imageAnalysis,
                smartContext: structuredContext.smartContext
              }
            })
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!finalResponse.ok) {
      const errorText = await finalResponse.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${finalResponse.status}`);
    }

    const data = await finalResponse.json();
    console.log("OpenAI response received:", {
      hasChoices: !!data.choices,
      firstChoiceLength: data.choices?.[0]?.message?.content?.length
    });
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from OpenAI");
    }

    try {
      const parsedResponse = JSON.parse(data.choices[0].message.content);
      
      // Ensure all questions from image analysis are properly attributed
      if (structuredContext.imageAnalysis && parsedResponse.questions) {
        parsedResponse.questions = parsedResponse.questions.map(q => {
          if (q.answer?.startsWith("PRE-FILLED:") && q.contextSource === "image" && !q.answer.includes("(from image analysis)")) {
            q.answer = `${q.answer} (from image analysis)`;
          }
          return q;
        });
      }

      console.log("Successfully parsed final response:", {
        questionsCount: parsedResponse.questions?.length || 0,
        preFilledCount: parsedResponse.questions?.filter(q => q.answer?.startsWith("PRE-FILLED:")).length || 0,
        hasVariables: !!parsedResponse.variables,
        hasMasterCommand: !!parsedResponse.masterCommand
      });
      
      return {
        content: JSON.stringify(parsedResponse),
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

