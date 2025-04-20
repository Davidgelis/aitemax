
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
    if (imageBase64) {
      cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '').replace(/\s/g, '');
      
      if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
        throw new Error("Invalid base64 format");
      }
      
      console.log(`Valid image data detected, length: ${cleanBase64.length}`);
    }
    
    // Enhanced user content construction with specific image analysis instructions
    let userContent: string | Array<any>;
    if (cleanBase64) {
      userContent = [
        {
          type: "text",
          text: `Analyze this prompt and provide detailed insights: ${promptText}${smartContext ? `\n\nAdditional context: ${smartContext}` : ''}\n\nFor any images provided, create a detailed analysis (under 1000 characters) describing the subject, style, composition, and other visual elements that could be relevant to understanding the user's intent. Use this analysis to pre-fill appropriate questions about how the user wants to use these visual elements.`
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
      userContent = `Analyze this prompt and provide detailed insights: ${promptText}${smartContext ? `\n\nAdditional context: ${smartContext}` : ''}`;
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
    throw error;
  }
}
