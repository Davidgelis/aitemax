
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
      
      console.log("Valid image data detected, length:", cleanBase64.length);
    }
    
    // Enhanced system message focused on identifying customizable elements
    const enhancedSystemMessage = `${systemMessage}\n\n
IMPORTANT INSTRUCTIONS FOR VARIABLE EXTRACTION:
1. Identify key customizable elements in the user's request
2. Create variables for any elements that could be modified or customized
3. Focus on concrete, actionable parameters from the user's intent
4. Consider common variations of the requested elements
5. Extract specific characteristics or properties mentioned

For example:
- If user asks about "image of a dog", create variables like:
  * Dog Breed
  * Dog Color
  * Background Setting
  * Dog Action/Pose
- If user asks about "writing blog post", create variables like:
  * Topic Focus
  * Article Length
  * Writing Style
  * Target Audience

Always return variables in JSON format with 'name', 'value', and 'category' fields.\n\n`;
    
    // Prepare messages array
    const messages = [
      { role: 'system', content: enhancedSystemMessage }
    ];
    
    // Build user message with text and optionally include image
    let userContent: any;
    
    if (cleanBase64) {
      userContent = [
        {
          type: "text",
          text: `Analyze this prompt and identify customizable elements: ${promptText}${smartContext ? `\n\nAdditional context: ${smartContext}` : ''}`
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
      userContent = `Analyze this prompt and identify customizable elements: ${promptText}${smartContext ? `\n\nAdditional context: ${smartContext}` : ''}`;
    }
    
    messages.push({ role: 'user', content: userContent });
    
    // Make API call with enhanced focus on variable extraction
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7, // Slightly increased for more creative variable suggestions
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
    console.error("Error in analyzePromptWithAI:", error);
    throw error;
  }
}
