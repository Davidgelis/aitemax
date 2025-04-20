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
      // Clean base64 string (remove prefix if present and spaces)
      cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '').replace(/\s/g, '');
      
      // Validate base64 format using RegEx
      if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
        throw new Error("Invalid base64 format");
      }
      
      console.log("Valid image data detected, length:", cleanBase64.length);
    }
    
    // Enhance the system message to focus on variable extraction
    const enhancedSystemMessage = `${systemMessage}\n\nIMPORTANT: When analyzing the prompt, focus on:
1. Identifying explicit variables from the user's input
2. Extracting key parameters that might need to be adjustable
3. Understanding the relationships between different parts of the request
4. Looking for specific values that might need to be customized
5. Considering both explicit and implicit variables that would make the prompt more flexible\n\n`;
    
    // Prepare messages array for the API call
    const messages = [
      { role: 'system', content: enhancedSystemMessage },
    ];
    
    // Build user message with text and optionally include image
    let userContent: any;
    
    if (cleanBase64) {
      // If we have an image, use a content array with both text and image
      userContent = [
        {
          type: "text",
          text: `Analyze this prompt: ${promptText}${smartContext ? `\n\nAdditional context: ${smartContext}` : ''}`
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
      // Text-only message
      userContent = `Analyze this prompt: ${promptText}${smartContext ? `\n\nAdditional context: ${smartContext}` : ''}`;
    }
    
    messages.push({ role: 'user', content: userContent });
    
    // Make a single API call with all content
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model, // Use the provided model
        messages: messages,
        temperature: 0.5,
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
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
    
  } catch (error) {
    console.error("Error in analyzePromptWithAI:", error.message);
    throw error;
  }
}
