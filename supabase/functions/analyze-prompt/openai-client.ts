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
    smartContext: smartContext || null,
    promptText
  };
  
  // First, analyze the image if provided using gpt-4o
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
              content: `Analyze this image and extract structured information in JSON format. Include:
              - description: Detailed description of the image
              - subjects: Main subjects/elements in the image
              - style: Visual style and characteristics
              - technical: Technical aspects (resolution, quality, etc)
              - context: Any contextual information that might be relevant
              Return ONLY valid JSON.`
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

  // Build comprehensive context with metadata
  const enhancedContext = {
    userInput: {
      prompt: promptText,
      timestamp: new Date().toISOString()
    },
    context: {
      image: structuredContext.imageAnalysis,
      smart: smartContext ? {
        content: smartContext,
        type: "user-provided"
      } : null
    },
    instructions: {
      primary: "Generate comprehensive questions and pre-fill answers using available context",
      format: "Return valid JSON with questions array, variables array, masterCommand, and enhancedPrompt"
    }
  };

  console.log("Sending enhanced context to OpenAI:", {
    hasImageAnalysis: !!structuredContext.imageAnalysis,
    hasSmartContext: !!smartContext,
    promptLength: promptText.length
  });

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
