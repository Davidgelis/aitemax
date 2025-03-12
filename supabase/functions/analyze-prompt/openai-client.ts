
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
    
    // Format the additional context to be concise
    let formattedContext = additionalContext;
    if (additionalContext.includes("WEBSITE CONTEXT")) {
      // Extract just the website URL for better context inclusion with image
      const urlMatch = additionalContext.match(/URL: ([^\n]+)/);
      const websiteUrl = urlMatch ? urlMatch[1] : "website";
      formattedContext = `Analysis should consider both the image and content from ${websiteUrl}. ${additionalContext.split("WEBSITE CONTEXT")[1].split("YOUR TASK FOR WEBSITE ANALYSIS")[0].substring(0, 500)}...`;
    }
    
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: `Analyze this prompt for generating questions and variables: "${promptText}" 
          
Provide a CONCISE image analysis in 1-2 paragraphs only. Describe the key visual elements like subject, setting, colors, composition, and mood.

Then use these details to generate relevant questions and variables with pre-filled values based on what you directly observe in the image.
${formattedContext}`
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
1. FOCUS ON THE ORIGINAL PROMPT'S INTENT - the website content should enhance, not replace it
2. Create questions that relate to the original prompt's purpose, not about the website itself
3. If the prompt is about creating something (like a landing page), questions should be about that creation process
4. Use the website content to provide detailed answers that support the original prompt's goals
5. Extract 1-2 full sentences of detailed information from the website for question answers
6. Include concrete facts, quotes or examples from the website that support the original prompt's purpose
7. If the user asked to extract specific information (like "best practices"), focus on those items as they relate to the original prompt
8. Remember: website content is supplementary research material for enhancing the original prompt, not the primary subject`;
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
    console.log(`Total message count: ${messages.length}`);
    console.log(`Message with image: ${!!imageBase64}`);
    console.log(`Additional context length: ${additionalContext.length} characters`);
    
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
        timeout: 180, // 3 minute timeout
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
