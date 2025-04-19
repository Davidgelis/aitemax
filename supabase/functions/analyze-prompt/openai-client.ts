
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
              content: 'Extract detailed information from this image that can enhance the prompt and pre-fill relevant questions.'
            },
            {
              role: 'user',
              content: [
                {
                  type: "text",
                  text: "Analyze this image in detail, focusing on elements that could help enhance the prompt:"
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
          response_format: { type: "json_object" },
          max_tokens: 1000
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
3. Focus on expanding the user's intent
4. Return response in valid JSON format
5. Mark pre-filled answers with "PRE-FILLED: " prefix`;

  console.log("Sending enhanced context to OpenAI:", {
    contextLength: enhancedContext.length,
    hasSmartContext: !!smartContext,
    hasImageAnalysis: !!imageAnalysisResult
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
