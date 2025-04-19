
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
              content: 'You are a specialized image analyzer. Extract key details and components from the image.'
            },
            {
              role: 'user',
              content: [
                {
                  type: "text",
                  text: "Analyze this image in detail and describe its key elements, colors, composition, and any notable features:"
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
  
  const messages = [
    { 
      role: 'system', 
      content: `${systemMessage}\n\nIMPORTANT INSTRUCTIONS FOR CONTEXT ANALYSIS:
1. Analyze ALL available context sources thoroughly
2. Pre-fill answers using information from ANY context source
3. Start all pre-filled answers with "PRE-FILLED: "
4. Mark questions as relevant when you can confidently pre-fill answers
5. Be thorough in analyzing visual elements if an image is provided
6. Extract specific details from image analysis to pre-fill answers
7. Ensure all extracted information is reflected in the questions`
    }
  ];

  // Enhanced prompt to ensure proper context handling and JSON structure
  let enhancedPrompt = `ANALYZE THIS COMBINED CONTEXT:
${promptText}

${smartContext ? `ADDITIONAL CONTEXT TO USE FOR PRE-FILLING:\n${smartContext}\n` : ''}
${imageAnalysisResult ? `IMAGE ANALYSIS RESULTS:\n${imageAnalysisResult}\n` : ''}

REQUIREMENTS:
1. Return a valid JSON object
2. Include questions with unique IDs
3. Pre-fill answers using ALL available context sources
4. Mark questions as relevant when pre-filled
5. Organize by categories
6. Use image analysis results to pre-fill relevant answers

EXPECTED FORMAT:
{
  "questions": [
    {
      "id": "q-1",
      "category": "Task",
      "text": "What is the main goal?",
      "answer": "PRE-FILLED: Based on context...",
      "isRelevant": true
    }
  ],
  "variables": [],
  "masterCommand": "",
  "enhancedPrompt": ""
}`;

  if (imageBase64) {
    console.log("Adding image for final prompt analysis");
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: enhancedPrompt
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
      content: enhancedPrompt
    });
  }

  try {
    console.log("Calling OpenAI API with context lengths:", {
      promptLength: promptText.length,
      smartContextLength: smartContext.length,
      imageAnalysisLength: imageAnalysisResult.length,
      systemMessageLength: systemMessage.length,
      hasImage: !!imageBase64
    });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
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
    console.log("Raw OpenAI response received, validating format...");
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from OpenAI");
    }

    const responseContent = data.choices[0].message.content;
    console.log("Response content length:", responseContent.length);

    // Parse and validate the JSON response
    try {
      const parsedResponse = JSON.parse(responseContent);
      console.log("Successfully parsed JSON response:", {
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

