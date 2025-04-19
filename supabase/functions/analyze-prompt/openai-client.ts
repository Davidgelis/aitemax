
// OpenAI API client for prompt analysis

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
  
  // Enhanced context handling for all smart features
  let enhancedUserPrompt = `Analyze this prompt for generating questions and variables: "${promptText}"

FIRST, DEEPLY ANALYZE the main intent behind this prompt to understand what the user wants to accomplish.

CRITICAL: When pre-filling answers and values:
1. Only pre-fill information that is DIRECTLY related to the prompt's intent
2. Pre-fill with DETAILED, SPECIFIC information (3-5 sentences for questions, 1-4 words for variables)
3. Mark all pre-filled content with "PRE-FILLED:" prefix
4. Leave questions blank if they cannot be confidently answered from the context
5. Ensure pre-filled answers are concrete and specific, not vague references`;

  // If we have an image, add image-specific instructions
  if (imageBase64) {
    console.log("Image provided for analysis - adding to OpenAI API request");
    
    // Extract image context instructions if present
    const imageInstructionsMatch = additionalContext.match(/SPECIFIC IMAGE ANALYSIS INSTRUCTIONS: (.*?)(\n\n|$)/s);
    const imageInstructions = imageInstructionsMatch ? imageInstructionsMatch[1].trim() : '';
    
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: `${enhancedUserPrompt}

ANALYZE THIS IMAGE WITH THESE SPECIFIC INSTRUCTIONS: ${imageInstructions}

Then:
1. Pre-fill questions that can be answered directly from the image with DETAILED descriptions
2. Create additional questions for context that's missing but needed
3. Pre-fill variable values with specific, concrete details from the image
4. Mark all pre-filled content with "PRE-FILLED:" prefix
5. Group questions by relevant categories
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
  } else if (additionalContext.includes("WEBSITE CONTEXT")) {
    console.log("Website context provided - handling website data");
    messages.push({
      role: 'user',
      content: `${enhancedUserPrompt}

${additionalContext}

When pre-filling from website content:
1. Extract SPECIFIC quotes and examples that relate to the prompt
2. Pre-fill questions with 3-5 sentences of detailed information
3. Use concrete facts and examples from the website
4. Mark all pre-filled content with "PRE-FILLED:" prefix
5. Create additional questions for missing context`
    });
  } else if (additionalContext.includes("SMART CONTEXT")) {
    console.log("Smart context provided - processing additional context");
    messages.push({
      role: 'user',
      content: `${enhancedUserPrompt}

${additionalContext}

When pre-filling from smart context:
1. Extract SPECIFIC information that relates to the prompt
2. Pre-fill questions with detailed, relevant information
3. Use concrete examples and details from the context
4. Mark all pre-filled content with "PRE-FILLED:" prefix
5. Create additional questions for missing context`
    });
  } else {
    messages.push({
      role: 'user',
      content: `${enhancedUserPrompt} ${additionalContext}`
    });
  }
  
  try {
    console.log("Calling OpenAI API for prompt analysis...");
    console.log("Message count:", messages.length);
    
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
    
    console.log("Successfully analyzed prompt with context");
    console.log("Response content length:", data.choices[0].message.content.length);
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
