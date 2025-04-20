
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
1. ALWAYS identify key customizable elements from the user's prompt
2. Focus on concrete, actionable parameters that could be modified
3. Create variables for elements that are central to the request
4. Look for specific characteristics or properties mentioned
5. Return variables in this exact JSON format:
{
  "variables": [
    {
      "id": "string",
      "name": "string",
      "value": "string",
      "isRelevant": true,
      "category": "string",
      "code": "string"
    }
  ]
}

Examples of good variable extraction:
- For "generate image of a dog playing with a red ball":
  * Dog Breed (if not specified, leave value empty)
  * Ball Color (value: "red")
  * Background Setting
  * Dog Action (value: "playing")
  
- For "write a blog post about coffee":
  * Coffee Type
  * Article Length
  * Writing Style
  * Target Audience

Always ensure at least 2-3 relevant variables are created.\n\n`;
    
    // Prepare messages array with enhanced focus on variable extraction
    const messages = [
      { 
        role: 'system', 
        content: enhancedSystemMessage 
      },
      {
        role: 'user',
        content: userContent
      }
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
    console.log("OpenAI response:", JSON.stringify(data.choices[0].message.content).substring(0, 200));
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
    
  } catch (error) {
    console.error("Error in analyzePromptWithAI:", error);
    throw error;
  }
}
