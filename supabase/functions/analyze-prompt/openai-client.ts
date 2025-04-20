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

  let structuredContext = {
    imageAnalysis: null,
    smartContext: null,
    promptText
  };
  
  // Process image if available
  if (imageBase64) {
    console.log("Analyzing image with gpt-4o...");
    try {
      const imageAnalysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `Analyze this image and extract detailed structured information in JSON format. Include:
              - description: Comprehensive description of the image
              - subjects: Main subjects/elements with detailed attributes
              - style: Visual style characteristics, colors, composition
              - technical: Resolution, quality, lighting, perspective
              - context: Mood, setting, intended purpose
              - potential_use: Suggested applications or uses
              Return ONLY valid JSON with these exact fields.`
            },
            {
              role: 'user',
              content: [
                {
                  type: "text",
                  text: "Analyze this image in detail:"
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
          response_format: { type: "json_object" }
        }),
      });

      const analysisData = await imageAnalysisResponse.json();
      console.log("Raw image analysis response:", analysisData);
      
      if (analysisData.choices?.[0]?.message?.content) {
        try {
          structuredContext.imageAnalysis = JSON.parse(analysisData.choices[0].message.content);
          console.log("Structured image analysis:", structuredContext.imageAnalysis);
        } catch (parseError) {
          console.error("Failed to parse image analysis JSON:", parseError);
          structuredContext.imageAnalysis = { error: "Failed to parse analysis" };
        }
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      structuredContext.imageAnalysis = { error: "Failed to analyze image" };
    }
  }

  // Process smart context first if available
  if (smartContext) {
    console.log("Processing smart context for enhanced analysis");
    try {
      const smartContextResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `Analyze the provided context and extract structured information in JSON format. Include:
              - key_points: Main points or requirements
              - technical_details: Any technical specifications
              - preferences: Style or format preferences
              - constraints: Any limitations or restrictions
              - metadata: Any other relevant contextual information
              Return ONLY valid JSON.`
            },
            {
              role: 'user',
              content: smartContext
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      const smartData = await smartContextResponse.json();
      if (smartData.choices?.[0]?.message?.content) {
        try {
          structuredContext.smartContext = JSON.parse(smartData.choices[0].message.content);
          console.log("Structured smart context:", structuredContext.smartContext);
        } catch (parseError) {
          console.error("Failed to parse smart context JSON:", parseError);
        }
      }
    } catch (error) {
      console.error("Error processing smart context:", error);
    }
  }

  // Build comprehensive context with metadata for better question pre-filling
  const enhancedContext = {
    userInput: {
      prompt: promptText,
      timestamp: new Date().toISOString()
    },
    context: {
      image: structuredContext.imageAnalysis,
      smart: structuredContext.smartContext ? {
        content: structuredContext.smartContext,
        type: "structured",
        source: "user-provided"
      } : null
    },
    instructions: {
      primary: "Generate comprehensive questions and pre-fill answers using all available context",
      format: "Return valid JSON with questions array, variables array, masterCommand, and enhancedPrompt"
    },
    metadata: {
      hasImageAnalysis: !!structuredContext.imageAnalysis && !structuredContext.imageAnalysis.error,
      hasSmartContext: !!structuredContext.smartContext
    }
  };

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
          { 
            role: 'system', 
            content: systemMessage 
          },
          {
            role: 'user',
            content: JSON.stringify(enhancedContext)
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from OpenAI");
    }

    try {
      const parsedResponse = JSON.parse(data.choices[0].message.content);
      console.log("Successfully parsed response:", {
        questionsCount: parsedResponse.questions?.length || 0,
        preFilledCount: parsedResponse.questions?.filter((q: any) => q.answer?.startsWith("PRE-FILLED:")).length || 0,
        hasVariables: !!parsedResponse.variables,
        hasMasterCommand: !!parsedResponse.masterCommand,
        hasEnhancedPrompt: !!parsedResponse.enhancedPrompt
      });
      
      // Validate response format
      if (!Array.isArray(parsedResponse.questions) || 
          !Array.isArray(parsedResponse.variables) || 
          typeof parsedResponse.masterCommand !== 'string' ||
          typeof parsedResponse.enhancedPrompt !== 'string') {
        throw new Error("Invalid response structure");
      }
      
      return {
        content: JSON.stringify(parsedResponse),
        usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      throw new Error("Invalid JSON response from OpenAI");
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
