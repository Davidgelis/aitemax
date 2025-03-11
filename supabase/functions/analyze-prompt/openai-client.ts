
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
    console.log("Image provided for analysis - adding to OpenAI API request with GPT-4o");
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: `Analyze this prompt for generating questions and variables: "${promptText}" 
          
First, describe the image in great detail. Extract all specific visual elements like subject, viewpoint, perspective, setting, lighting, colors, mood, composition, time of day, season, etc.

Then use these details to generate relevant questions and variables with pre-filled values based on what you directly observe in the image.
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
    // No image, just use a simple text message with additional context
    console.log("No image provided - using text-only OpenAI API request");
    console.log("Additional context provided:", additionalContext ? "Yes" : "No");
    
    // Enhance user prompt with more specific instructions for website analysis
    let messageText = `Analyze this prompt for generating questions and variables: "${promptText}"`;
    
    if (additionalContext.includes("WEBSITE CONTEXT")) {
      messageText += `

${additionalContext}

When creating and pre-filling questions:
1. Extract DETAILED information from the website content
2. Write 1-2 full sentences in each answer, directly quoting or closely paraphrasing the website
3. Make questions that are specifically relevant to both the prompt and the website content
4. Focus especially on any specific instructions the user provided for analyzing the website
5. For each answer, include at least one concrete detail, fact, or quote from the website
6. For questions about "best practices" or similar terms that the user has instructed you to find, EXTRACT ALL relevant practices, recommendations, or guidelines from the website content
7. If the user has asked for specific information (like "best practices", "guidelines", "steps", etc.), make sure to create questions that will elicit those specific items from the content`;
    } else {
      messageText += ` ${additionalContext}`;
    }
    
    messages.push({
      role: 'user',
      content: messageText
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
        model: 'gpt-4o', // Using GPT-4o for analysis
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
