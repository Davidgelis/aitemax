
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
1. Generate comprehensive questions for EACH pillar in the template framework
2. Create at least 1-2 variables for EACH pillar in the template
3. When smart context is provided:
   - Use it as the PRIMARY source to pre-fill answers with DETAILED paragraphs (3-5 sentences)
   - Extract specific values for variables (1-4 words)
   - Mark all pre-filled content with "PRE-FILLED:" prefix
4. When user's prompt contains specific details:
   - Incorporate these details into pre-filled answers
   - Use them to pre-fill relevant variables
5. Maintain consistency between questions and variables
6. ALWAYS ensure questions are categorized by template pillars`
    }
  ];
  
  let enhancedUserPrompt = `Analyze this prompt/intent: "${promptText}"

ANALYSIS STEPS:
1. Generate 3-4 comprehensive questions for EACH pillar about:
   - Core requirements and specifications
   - Style and tone preferences
   - Technical constraints
   - Contextual requirements
2. Create 1-2 variables for EACH pillar
3. Pre-fill answers using context from:
   - Smart button data (detailed paragraphs)
   - User's input (specific details)
   - Image analysis (if provided)
4. Extract concise variable values from context
5. Organize questions and variables by pillar categories`;

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
1. Generate 3-4 questions for EACH pillar in the template
2. Pre-fill questions that can be answered directly from the image with DETAILED descriptions
3. Create 1-2 variables for EACH pillar in the template
4. Pre-fill variable values with specific, concrete details from the image
5. Mark all pre-filled content with "PRE-FILLED:" prefix
6. Group questions and variables by template pillar categories
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
1. First, generate 3-4 questions for EACH pillar in the template
2. Create 1-2 variables for EACH pillar in the template
3. Then, use the smart context to:
   - Write detailed, multi-sentence answers (3-5 sentences) for relevant questions
   - Extract specific values (1-4 words) for variables
   - Mark all pre-filled content with "PRE-FILLED:" prefix
4. Use details from the user's prompt to further enhance pre-filled content
5. Ensure questions and variables are grouped by pillar categories
6. Maintain consistency between questions and variables`
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
    console.log("Calling OpenAI API with enhanced template-based questions");
    
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
