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
    { 
      role: 'system', 
      content: `${systemMessage}

CRITICAL CONTEXT HANDLING:
1. Always prioritize context from smart features (website, image, or smart context) over the base prompt
2. Extract specific, detailed information from the context to pre-fill answers and variables
3. Use "PRE-FILLED:" prefix for all pre-filled content
4. Ensure pre-filled answers are 3-5 sentences long with concrete details
5. Keep variable values concise (1-4 words) but specific
6. Only pre-fill information that directly relates to the prompt's intent`
    }
  ];
  
  let enhancedUserPrompt = `Analyze this prompt: "${promptText}"

FIRST, DEEPLY ANALYZE the main intent and requirements.

CRITICAL PRE-FILLING RULES:
1. Pre-fill with DETAILED, SPECIFIC information from context
2. Mark ALL pre-filled content with "PRE-FILLED:" prefix
3. Leave questions blank if they cannot be confidently answered
4. Ensure pre-filled answers are concrete and specific
5. Generate relevant variables based on identified requirements`;

  // Enhanced context handling with better logging
  if (imageBase64) {
    console.log("Processing image analysis with context");
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
    console.log("Processing website context");
    messages.push({
      role: 'user',
      content: `${enhancedUserPrompt}

${additionalContext}

WEBSITE CONTENT PRE-FILLING RULES:
1. Extract SPECIFIC quotes and examples that relate to the prompt
2. Pre-fill questions with detailed website information (3-5 sentences)
3. Create variables for key website elements and pre-fill their values
4. Mark all pre-filled content with "PRE-FILLED:" prefix
5. Generate additional questions for missing context`
    });
  } else if (additionalContext.includes("SMART CONTEXT")) {
    console.log("Processing smart context");
    messages.push({
      role: 'user',
      content: `${enhancedUserPrompt}

${additionalContext}

SMART CONTEXT PRE-FILLING RULES:
1. Extract SPECIFIC information from the provided context
2. Pre-fill questions with detailed context information (3-5 sentences)
3. Create and pre-fill variables based on context data
4. Mark all pre-filled content with "PRE-FILLED:" prefix
5. Generate additional questions for missing information`
    });
  } else {
    messages.push({
      role: 'user',
      content: `${enhancedUserPrompt} ${additionalContext}`
    });
  }
  
  try {
    console.log("Calling OpenAI API with enhanced context handling");
    
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
