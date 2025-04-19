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
1. Generate pillar-based questions FIRST using template categories
2. Then analyze provided context to pre-fill answers when confident
3. Mark pre-filled answers with "PRE-FILLED:" prefix
4. Focus on accuracy and relevance in pre-filling
5. Leave questions blank when uncertain
6. Ensure all pre-filled answers are detailed (3-5 sentences)
7. Keep questions organized by pillar categories
8. Do not generate new questions from context`
    }
  ];
  
  let enhancedUserPrompt = `Analyze this prompt/intent: "${promptText}"

ANALYSIS STEPS:
1. Generate 3-4 questions for EACH template pillar category
2. Create 1-2 variables per pillar
3. If smart context provided:
   - Carefully analyze context details
   - Map relevant information to existing questions
   - Pre-fill answers with "PRE-FILLED:" prefix and details
   - Leave questions blank if no relevant information
4. Extract specific variable values
5. Organize by pillar categories
6. Double-check all pre-filled answers match questions`;

  if (imageBase64) {
    console.log("Processing image analysis with enhanced pre-filling rules");
    const imageInstructionsMatch = additionalContext.match(/SPECIFIC IMAGE ANALYSIS INSTRUCTIONS: (.*?)(\n\n|$)/s);
    const imageInstructions = imageInstructionsMatch ? imageInstructionsMatch[1].trim() : '';
    
    // Enhanced image analysis instructions for better pre-filling
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: `${enhancedUserPrompt}

IMAGE ANALYSIS WORKFLOW:
1. First, generate standard pillar-based questions
2. Analyze image focusing on: ${imageInstructions}
3. Generate detailed analysis (3-5 sentences) specifically for the requested aspects
4. Map analysis to questions by:
   - Finding direct connections between image details and questions
   - Using "PRE-FILLED:" prefix for every mapped answer
   - Writing detailed, specific answers (3-5 sentences)
   - Only pre-filling when highly confident
5. Format pre-filled answers:
   PRE-FILLED: Specific detail about [aspect] including [technical elements]. 
   This demonstrates [relevant context] through [concrete examples]. 
   The execution showcases [distinctive features].
6. Maintain pillar categories structure
7. Double-check all pre-filled content matches questions

RESPONSE STRUCTURE:
### Task Questions:
[Questions with PRE-FILLED answers when image matches]

### Style Questions:
[Questions with PRE-FILLED answers when image matches]

### Technical Questions:
[Questions with PRE-FILLED answers when image matches]

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
      content: `${enhancedUserPrompt}

${additionalContext}

SMART CONTEXT PRE-FILLING WORKFLOW:
1. First generate standard pillar-based questions
2. Analyze provided context thoroughly
3. Map context to questions:
   - Find specific details that answer questions
   - Use "PRE-FILLED:" prefix for mapped answers
   - Write detailed, multi-sentence answers
   - Only pre-fill when highly confident
4. Format all pre-filled answers:
   PRE-FILLED: Primary detail or finding from context.
   Supporting evidence or examples from provided information.
   Specific implementation or practical aspects.
5. Maintain pillar categories organization
6. Review pre-filled answers for accuracy`
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
    console.log("Calling OpenAI API with enhanced pre-filling rules");
    
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
