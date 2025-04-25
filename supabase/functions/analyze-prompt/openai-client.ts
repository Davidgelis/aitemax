
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
    let userContent: string | Array<any> = promptText;
    
    // Only add smart context if it exists and is meaningful
    if (smartContext && typeof smartContext === 'string' && smartContext.trim().length > 0) {
      userContent = `${promptText}\n\nAdditional context: ${smartContext}`;
    }

    // Prepare messages array
    const messages = [
      { 
        role: 'system', 
        content: `${systemMessage}\n\nIMPORTANT GUIDELINES FOR QUESTION GENERATION:
1. Generate questions ONLY based on the user's prompt text
2. Each question must directly relate to understanding or clarifying the user's specific request
3. Organize questions according to the template pillars provided
4. Each question must include a brief, one-sentence example answer
5. Do not generate generic questions - every question must be specific to the user's input
6. Questions must help gather missing information needed to fulfill the user's request`
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
