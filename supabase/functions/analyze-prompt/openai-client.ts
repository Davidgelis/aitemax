
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

STRUCTURED OUTPUT FORMAT:
1. Generate questions by category (Task, Style, Technical, etc.)
2. For each question:
   - Must have a unique ID and category
   - For pre-filled answers, use "PRE-FILLED:" prefix
   - Write detailed 3-5 sentence answers when pre-filling
3. Mark relevance explicitly (true/false/null)
4. Ensure proper JSON structure for frontend parsing

Example structure:
{
  "questions": [
    {
      "id": "q-1",
      "category": "Task",
      "text": "What is the goal?",
      "answer": "PRE-FILLED: Based on the provided context...",
      "isRelevant": true
    }
  ]
}`
    }
  ];

  let enhancedPrompt = `PROMPT ANALYSIS REQUEST:
"${promptText}"

OUTPUT REQUIREMENTS:
1. Generate consistent question IDs (q-1, q-2, etc.)
2. Pre-fill answers when confident using context
3. Add "PRE-FILLED:" prefix to pre-filled answers
4. Set isRelevant true for pre-filled questions
5. Organize by categories
6. Include detailed explanations in pre-filled answers`;

  if (imageBase64) {
    console.log("Processing image analysis with enhanced pre-filling rules");
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: `${enhancedPrompt}

IMAGE ANALYSIS INSTRUCTIONS:
1. Analyze image thoroughly
2. Map visual elements to question categories
3. Pre-fill answers with specific details observed
4. Use "PRE-FILLED:" prefix for answers
5. Write detailed 3-5 sentence answers
6. Set isRelevant true for pre-filled questions

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
  } else if (additionalContext.includes("SMART CONTEXT")) {
    console.log("Processing smart context with enhanced pre-filling rules");
    messages.push({
      role: 'user',
      content: `${enhancedPrompt}

SMART CONTEXT INSTRUCTIONS:
1. Analyze provided context thoroughly
2. Map context details to question categories
3. Pre-fill answers using context information
4. Use "PRE-FILLED:" prefix for all pre-filled answers
5. Write detailed 3-5 sentence answers
6. Set isRelevant true for pre-filled questions

${additionalContext}`
    });
  } else {
    messages.push({
      role: 'user',
      content: `${enhancedPrompt}

${additionalContext}`
    });
  }

  try {
    console.log("Calling OpenAI API with enhanced pre-filling configuration");
    console.log("Context type:", imageBase64 ? "Image" : additionalContext.includes("SMART CONTEXT") ? "Smart Context" : "Standard");
    
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

    // Log the response to check pre-filled answers
    const responseContent = data.choices[0].message.content;
    console.log("Response from OpenAI:");
    console.log("- Contains PRE-FILLED prefix:", responseContent.includes("PRE-FILLED:"));
    console.log("- Number of pre-filled answers:", (responseContent.match(/PRE-FILLED:/g) || []).length);
    
    return {
      content: responseContent,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
    
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
