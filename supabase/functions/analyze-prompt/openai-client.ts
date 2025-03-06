
// OpenAI API client for prompt analysis

/**
 * Sends a prompt for analysis to OpenAI API
 */
export async function analyzePromptWithAI(
  promptText: string, 
  systemMessage: string, 
  apiKey: string
): Promise<any> {
  const userMessage = `Analyze this prompt: "${promptText}"`;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error("OpenAI API error:", errorData);
    throw new Error(`OpenAI API responded with status ${response.status}: ${errorData}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}
