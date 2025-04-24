export async function analyzePromptWithAI(
  promptText: string, 
  systemMessage: string, 
  apiKey: string,
  smartContext: string = "",
  imageBase64?: string | null,
  model: string = "gpt-4o"
): Promise<any> {
  if (!promptText || typeof promptText !== 'string') {
    console.error("Invalid prompt text:", promptText);
    throw new Error("Invalid prompt text provided");
  }

  if (!apiKey) {
    console.error("Missing API key");
    throw new Error("OpenAI API key is required");
  }

  console.log(`Using OpenAI model: ${model}`);

  try {
    // Validate and clean base64 string if provided
    let cleanBase64 = null;
    let imageInstructions = null;
    
    if (imageBase64) {
      try {
        cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '').replace(/\s/g, '');
        
        // Extract user's analysis instructions from the prompt
        const instructionsMatch = promptText.match(/Image Analysis Instructions:\s*([^]*?)(?:\n\n|$)/i);
        imageInstructions = instructionsMatch ? instructionsMatch[1].trim() : null;
        
        // Validate base64 string
        const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(cleanBase64);
        if (!isValidBase64) {
          console.error("Invalid base64 string for image");
          cleanBase64 = null; // Don't use the invalid image
        } else {
          console.log("Image analysis instructions detected:", imageInstructions);
        }
      } catch (error) {
        console.error("Error processing image data:", error);
        cleanBase64 = null; // Reset on error
      }
    }
    
    let userContent: string | Array<any>;
    if (cleanBase64) {
      userContent = [
        {
          type: "text",
          text: `Analyze this prompt with the following context:\n${promptText}${
            smartContext ? `\n\nAdditional context: ${smartContext}` : ''
          }\n\nFor image analysis:\n1. Only analyze aspects specifically requested by user\n2. Provide clear, factual descriptions of requested elements\n3. Focus on describing what exists, not suggesting changes\n\nUser's image analysis instructions: ${imageInstructions || 'No specific instructions provided'}`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${cleanBase64}`,
            detail: "high"
          }
        }
      ];
    } else {
      userContent = promptText + (smartContext ? `\n\nAdditional context: ${smartContext}` : '');
    }

    // Prepare messages array after userContent is defined
    const messages = [
      { 
        role: 'system', 
        content: systemMessage 
      },
      {
        role: 'user',
        content: userContent
      }
    ];

    // Make API call with proper JSON format configuration
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorText);
      
      // Provide a fallback response for common error scenarios
      if (response.status === 413 || response.status === 429 || response.status === 400) {
        console.log("Providing fallback response due to API error");
        return {
          content: JSON.stringify({
            questions: [],
            variables: [],
            masterCommand: "",
            enhancedPrompt: promptText,
            error: `API Error (${response.status}): ${errorText.substring(0, 100)}`
          }),
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        };
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`OpenAI response received, content length: ${data.choices[0].message.content.length}`);
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
    
  } catch (error) {
    console.error("Error in analyzePromptWithAI:", error);
    
    // Provide a fallback response for unhandled errors
    return {
      content: JSON.stringify({
        questions: [],
        variables: [],
        masterCommand: "",
        enhancedPrompt: promptText,
        error: `Error: ${error.message || "Unknown error occurred"}`
      }),
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }
}
