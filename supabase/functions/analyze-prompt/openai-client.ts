
// OpenAI API client for prompt analysis

/**
 * Sends a prompt for analysis to OpenAI API
 */
export async function analyzePromptWithAI(
  promptText: string, 
  systemMessage: string, 
  apiKey: string,
  additionalContext: string = "",
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
  
  const messages = [
    { role: 'system', content: systemMessage }
  ];
  
  // If we have an image, create a message with content parts
  if (imageBase64) {
    console.log("Image provided for analysis - adding to OpenAI API request");
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: `Analyze this prompt for generating questions and variables: "${promptText}" 
          
IMPORTANT: Thoroughly analyze the image and extract SPECIFIC details to pre-fill questions and variables:

First, describe the image in EXTREME detail. Extract ALL specific visual elements like:
- Subject(s): What/who is in the image (people, objects, landscapes)
- Viewpoint: How the scene is viewed (looking up, eye-level, aerial view)
- Perspective: The position relative to the subject (close-up, distant, etc.)
- Setting/Location: The environment where the scene takes place
- Lighting: Quality, direction, and color of light
- Colors: Dominant palette, contrasts, saturation
- Mood/Atmosphere: The feeling conveyed by the image
- Composition: How elements are arranged in the frame
- Time of day: Morning, afternoon, evening, night
- Season: Spring, summer, fall, winter
- Weather: Clear, cloudy, rainy, etc.
- Textures: Smooth, rough, detailed, etc.
- Style: If applicable (photorealistic, cartoon, painting style)

CRITICAL: You MUST pre-fill at least 3-5 variables and 2-4 questions with SPECIFIC information from the image. DO NOT use generic placeholders - use exact details you can observe:

For example:
- If you see a forest → Setting variable = "Dense forest with tall pine trees"
- If image has a sunset → TimeOfDay variable = "Sunset with golden hour lighting"
- If image shows rain → Weather variable = "Rainy with wet surfaces"

For each pre-filled variable or question, you MUST set isRelevant to true. For example:
{
  "id": "v1",
  "name": "Setting",
  "value": "Dense forest with tall pine trees",
  "isRelevant": true,
  "category": "Location"
}

DO NOT FAIL TO SET THE isRelevant FLAG TO TRUE for pre-filled items.

${additionalContext}`
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
    // No image, just use a simple text message with appropriate context
    console.log("No image provided - using text-only OpenAI API request");
    
    let userPrompt = `Analyze this prompt for generating questions and variables: "${promptText}"`;
    
    if (additionalContext) {
      userPrompt += `\n\n${additionalContext}\n\nIMPORTANT: Based on the provided website context, you MUST pre-fill variables and question answers with SPECIFIC values that you can directly observe in the content. Pre-fill at least 3-5 variables and 2-4 questions with concrete values from the website content, not placeholders. For each pre-filled variable or question, you MUST set isRelevant to true. For example:

{
  "id": "q1",
  "text": "What is the main topic?",
  "answer": "AI-powered content creation tools",
  "isRelevant": true
}

{
  "id": "v1",
  "name": "Topic",
  "value": "AI-powered content creation tools",
  "isRelevant": true
}

DO NOT FAIL TO SET THE isRelevant FLAG TO TRUE for pre-filled items.`;
    }
    
    messages.push({
      role: 'user',
      content: userPrompt
    });
  }
  
  try {
    console.log("Calling OpenAI API with GPT-4o for prompt analysis...");
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Continue using GPT-4o for analysis
        messages,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      let errorMessage = `OpenAI API responded with status ${response.status}`;
      try {
        const errorData = await response.text();
        console.error("OpenAI API error:", errorData);
        errorMessage += `: ${errorData}`;
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response from OpenAI API:", data);
      throw new Error("Invalid response format from OpenAI API");
    }
    
    console.log("Successfully analyzed prompt with GPT-4o");
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
