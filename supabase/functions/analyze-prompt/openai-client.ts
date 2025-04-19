
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

  let enhancedPrompt = `PROMPT ANALYSIS REQUEST:
"${promptText}"

STRUCTURED OUTPUT REQUIREMENTS:
1. Use JSON format for consistent parsing
2. Include questions array with:
   - Unique IDs (q-1, q-2, etc.)
   - Clear categories
   - Pre-filled answers when confident
   - "PRE-FILLED:" prefix for pre-filled answers
3. Mark pre-filled questions as relevant
4. Questions should be organized by categories

Example JSON structure:
{
  "questions": [
    {
      "id": "q-1",
      "category": "Task",
      "text": "What is the main goal?",
      "answer": "PRE-FILLED: Based on the context...",
      "isRelevant": true
    }
  ]
}`;

  if (imageBase64) {
    console.log("Processing image analysis with enhanced pre-filling");
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: `${enhancedPrompt}

IMAGE ANALYSIS INSTRUCTIONS:
1. Analyze image thoroughly
2. Extract specific visual details
3. Pre-fill answers with observed details
4. Use "PRE-FILLED:" prefix
5. Set isRelevant true for pre-filled answers

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
    messages.push({
      role: 'user',
      content: `${enhancedPrompt}

${additionalContext}`
    });
  }

  try {
    console.log("Calling OpenAI API with enhanced configuration");
    
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

    const responseContent = data.choices[0].message.content;
    
    // Log response details for debugging
    console.log("OpenAI Response received:");
    console.log("- Raw response excerpt:", responseContent.substring(0, 200));
    console.log("- Contains PRE-FILLED prefix:", responseContent.includes("PRE-FILLED:"));
    console.log("- Contains JSON structure:", responseContent.includes('"questions":'));
    
    return {
      content: responseContent,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
    
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
