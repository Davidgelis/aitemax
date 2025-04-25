
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
    let userContent: string | Array<any>;
    const messages = [
      { 
        role: 'system', 
        content: `${systemMessage}\n\nIMPORTANT GUIDELINES FOR QUESTION GENERATION:
1. Generate diverse questions that gather all necessary information about the user's prompt
2. Each question must directly relate to understanding or clarifying the user's specific request
3. Questions should cover different aspects of the user's needs, including style, format, content, and purpose
4. Each question must include brief example answers to guide the user
5. Generate at least 6-10 questions for any non-trivial prompt
6. Questions must help gather information needed to fulfill the user's request perfectly
7. Every question should be phrased in a conversational, user-friendly manner
8. Ensure questions cover both high-level goals and specific details needed to complete the request`
      }
    ];

    // Handle image analysis if we have an image
    if (imageBase64) {
      console.log("Including image in OpenAI request for multimodal analysis");
      
      userContent = [
        {
          type: "text",
          text: promptText + (smartContext ? `\n\nAdditional context: ${smartContext}` : '')
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high"
          }
        }
      ];
      
      // Add specific image analysis guidance
      messages.push({
        role: 'user',
        content: userContent
      });
      
      // Add follow-up message with image analysis instructions
      messages.push({
        role: 'system',
        content: `Also perform a detailed image analysis. For the image, analyze and provide:
1. Overall description of what's in the image
2. Main colors, themes, and visual elements
3. Key objects, people, or subjects
4. Style, mood, and composition
5. Any text visible in the image
6. Generate specific questions about what the user wants to do with or change about this image`
      });
    } else {
      // Text-only analysis
      userContent = promptText;
      
      // Only add smart context if it exists and is meaningful
      if (smartContext && typeof smartContext === 'string' && smartContext.trim().length > 0) {
        userContent = `${promptText}\n\nAdditional context: ${smartContext}`;
      }
      
      messages.push({
        role: 'user',
        content: userContent
      });
    }

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
