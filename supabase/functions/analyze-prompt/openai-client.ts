
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

  let imageAnalysisResult = "";
  
  // First, analyze the image if provided
  if (imageBase64) {
    console.log("Analyzing image before prompt generation...");
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
              content: 'You are a specialized image analyzer. Extract detailed information that can be used to enhance the prompt and pre-fill relevant questions.'
            },
            {
              role: 'user',
              content: [
                {
                  type: "text",
                  text: "Analyze this image in detail, focusing on elements that could help enhance and expand the user's prompt:"
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
          max_tokens: 500
        }),
      });

      const analysisData = await imageAnalysisResponse.json();
      if (analysisData.choices?.[0]?.message?.content) {
        imageAnalysisResult = analysisData.choices[0].message.content;
        console.log("Image analysis completed:", imageAnalysisResult.substring(0, 100) + "...");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      throw new Error("Failed to analyze image");
    }
  }

  // Build comprehensive context
  const enhancedContext = `
USER PROMPT:
${promptText}

${smartContext ? `SMART CONTEXT:
${smartContext}` : ''}

${imageAnalysisResult ? `IMAGE ANALYSIS:
${imageAnalysisResult}` : ''}

INSTRUCTIONS:
1. Use ALL available context to generate relevant questions
2. Pre-fill answers when context provides clear information
3. Ensure questions align with template pillars
4. Focus on expanding and enhancing the user's intent
5. Generate specific, detailed questions`;

  console.log("Sending context to OpenAI:", {
    contextLength: enhancedContext.length,
    hasSmartContext: !!smartContext,
    hasImageAnalysis: !!imageAnalysisResult,
    systemMessageLength: systemMessage.length
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
            content: enhancedContext
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
      console.log("Successfully generated response:", {
        questionsCount: parsedResponse.questions?.length || 0,
        preFilledCount: parsedResponse.questions?.filter((q: any) => q.answer?.startsWith("PRE-FILLED:")).length || 0,
        variablesCount: parsedResponse.variables?.length || 0,
        hasMasterCommand: !!parsedResponse.masterCommand,
        hasEnhancedPrompt: !!parsedResponse.enhancedPrompt
      });
      
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
