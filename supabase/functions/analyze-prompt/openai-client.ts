
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

SMART CONTEXT HANDLING:
1. Generate questions FIRST based on template pillars and user intent
2. Then use smart context to pre-fill answers, marking them with "PRE-FILLED:"
3. Do not generate new questions from smart context
4. Focus on finding relevant information in smart context to answer existing questions
5. Only pre-fill questions when confident about the answer
6. Leave questions blank if no relevant information is found
7. Pre-filled answers should be detailed and specific
8. Ensure consistency between questions and variables`
    }
  ];
  
  let enhancedUserPrompt = `Analyze this prompt/intent: "${promptText}"

ANALYSIS STEPS:
1. Generate 3-4 comprehensive questions for EACH pillar based on user intent
2. Create 1-2 variables for EACH pillar
3. If smart context is provided:
   - Use it to answer existing questions (do not create new ones)
   - Mark pre-filled answers with "PRE-FILLED:" prefix
   - Leave questions blank if no relevant information found
4. Extract concise variable values from context
5. Organize everything by pillar categories`;

  // Enhanced smart context handling
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

IMAGE ANALYSIS AND PRE-FILLING RULES:
1. First, generate standard questions for EACH pillar based on template and user intent
2. Then analyze the provided image with these instructions: ${imageInstructions}
3. Use image analysis results to:
   - Find specific details to answer existing questions
   - Pre-fill answers with "PRE-FILLED:" prefix and detailed descriptions
   - Leave questions blank if image doesn't provide relevant information
4. Extract specific values for variables from image content
5. Keep all questions grouped by template pillar categories
6. Do NOT generate new questions from image analysis
7. Focus on using image details to enhance existing questions

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
    console.log("Processing smart context with enhanced pre-filling");
    messages.push({
      role: 'user',
      content: `${enhancedUserPrompt}

${additionalContext}

SMART CONTEXT PRE-FILLING INSTRUCTIONS:
1. First, generate questions based ONLY on template pillars and user intent
2. Then, analyze smart context to:
   - Find specific answers for existing questions
   - Pre-fill answers with "PRE-FILLED:" prefix
   - Leave questions blank if no relevant information found
   - Write detailed, multi-sentence answers (3-5 sentences)
3. Extract specific values (1-4 words) for variables from context
4. Mark all pre-filled content with "PRE-FILLED:" prefix
5. Do not generate new questions from smart context
6. Ensure questions and variables stay grouped by pillar categories`
    });
  } else if (additionalContext.includes("WEBSITE CONTEXT")) {
    console.log("Processing website context");
    messages.push({
      role: 'user',
      content: `${enhancedUserPrompt}

${additionalContext}

WEBSITE CONTENT PRE-FILLING RULES:
1. Generate 3-4 questions for EACH pillar in the template
2. Create 1-2 variables for EACH pillar in the template
3. Extract SPECIFIC quotes and examples from the website that relate to the prompt
4. Pre-fill questions with detailed website information (3-5 sentences)
5. Create variables for key website elements and pre-fill their values
6. Mark all pre-filled content with "PRE-FILLED:" prefix
7. Ensure questions and variables are grouped by pillar categories`
    });
  } else {
    messages.push({
      role: 'user',
      content: `${enhancedUserPrompt}

TEMPLATE-BASED QUESTION GENERATION:
1. Generate 3-4 questions for EACH pillar in the template
2. Create 1-2 variables for EACH pillar in the template
3. Ensure questions are directly relevant to each pillar's purpose
4. Pre-fill any questions that can be answered from the user's prompt
5. Organize all questions and variables by pillar categories

${additionalContext}`
    });
  }
  
  try {
    console.log("Calling OpenAI API with enhanced template-based questions and pre-filling");
    
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
    
    console.log("Successfully analyzed prompt with template-based questions");
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
