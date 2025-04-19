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
      content: systemMessage
    }
  ];

  // Enhanced prompt to ensure proper JSON structure
  let enhancedPrompt = `ANALYZE THIS PROMPT:
"${promptText}"

REQUIREMENTS:
1. Return a valid JSON object
2. Include questions with unique IDs
3. Pre-fill answers when confident
4. Mark relevant questions
5. Organize by categories

EXPECTED FORMAT:
{
  "questions": [
    {
      "id": "q-1",
      "category": "Task",
      "text": "What is the main goal?",
      "answer": "PRE-FILLED: Based on context...",
      "isRelevant": true
    }
  ],
  "variables": [],
  "masterCommand": "",
  "enhancedPrompt": ""
}`;

  if (imageBase64) {
    console.log("Processing image analysis");
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: `${enhancedPrompt}\n\nANALYZE IMAGE AND PRE-FILL ANSWERS\n${additionalContext}`
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
    messages.push({
      role: 'user',
      content: `${enhancedPrompt}\n\n${additionalContext}`
    });
  }

  try {
    console.log("Calling OpenAI API");
    
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
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    console.log("Raw OpenAI response:", data);
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from OpenAI");
    }

    const responseContent = data.choices[0].message.content;
    console.log("Response content:", responseContent);

    // Try to parse the JSON response
    try {
      const parsedResponse = JSON.parse(responseContent);
      console.log("Successfully parsed JSON response:", parsedResponse);
      return {
        content: responseContent,
        usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      throw new Error("Invalid JSON response from OpenAI");
    }
    
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
