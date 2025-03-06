
// OpenAI API client for prompt analysis

/**
 * Sends a prompt for analysis to OpenAI API
 */
export async function analyzePromptWithAI(
  promptText: string, 
  systemMessage: string, 
  apiKey: string
): Promise<any> {
  if (!promptText || typeof promptText !== 'string') {
    console.error("Invalid prompt text:", promptText);
    throw new Error("Invalid prompt text provided");
  }

  if (!apiKey) {
    console.error("Missing API key");
    throw new Error("OpenAI API key is required");
  }
  
  // Sanitize and trim the prompt text to avoid empty spaces causing issues
  const sanitizedPromptText = promptText.trim();
  if (!sanitizedPromptText) {
    throw new Error("Prompt text cannot be empty");
  }
  
  const userMessage = `Analyze this prompt: "${sanitizedPromptText}"`;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
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
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
