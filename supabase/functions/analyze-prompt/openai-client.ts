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

SMART CONTEXT AND PRE-FILLING RULES:
1. Generate comprehensive questions for ALL aspects of the prompt/intent
2. Create variables for customizable elements
3. When smart context is provided:
   - Use it to pre-fill answers with DETAILED paragraphs (3-5 sentences)
   - Extract specific values for variables (1-4 words)
   - Mark all pre-filled content with "PRE-FILLED:" prefix
4. When user's prompt contains specific details:
   - Incorporate these details into pre-filled answers
   - Use them to pre-fill relevant variables
5. Maintain consistency between questions and variables`
    }
  ];
  
  let enhancedUserPrompt = `Analyze this prompt/intent: "${promptText}"

ANALYSIS STEPS:
1. Generate comprehensive questions about:
   - Core requirements and specifications
   - Style and tone preferences
   - Technical constraints
   - Contextual requirements
2. Create variables for customizable elements
3. Pre-fill answers using context from:
   - Smart button data (detailed paragraphs)
   - User's input (specific details)
   - Image analysis (if provided)
4. Extract concise variable values from context`;

  // Enhanced context handling
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
    console.log("Processing smart context with enhanced pre-filling");
    messages.push({
      role: 'user',
      content: `${enhancedUserPrompt}

${additionalContext}

SMART CONTEXT PRE-FILLING INSTRUCTIONS:
1. First, generate ALL possible relevant questions
2. Then, use the smart context to:
   - Write detailed, multi-sentence answers for relevant questions
   - Extract specific values for variables (1-4 words)
   - Mark all pre-filled content with "PRE-FILLED:" prefix
3. Finally, incorporate any specific details from the user's prompt
4. Ensure consistency between questions and variables`
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
