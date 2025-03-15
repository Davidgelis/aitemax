
// OpenAI API client for prompt analysis

/**
 * Sends a prompt for analysis to OpenAI API
 */
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
    { role: 'system', content: systemMessage }
  ];
  
  // If we have an image, create a message with content parts
  if (imageBase64) {
    console.log("Image provided for analysis - adding to OpenAI API request with GPT-4o");
    
    // Extract image context instructions if present in additionalContext
    let imageInstructionsText = "";
    const imageContextMatch = additionalContext.match(/SPECIFIC IMAGE ANALYSIS INSTRUCTIONS: (.*?)(\n\n|$)/s);
    if (imageContextMatch && imageContextMatch[1]) {
      imageInstructionsText = `\n\nFOCUS SPECIFICALLY ON THESE USER INSTRUCTIONS: ${imageContextMatch[1].trim()}`;
      console.log("Found specific image analysis instructions:", imageInstructionsText);
    }
    
    messages.push({
      role: 'user',
      content: [
        {
          type: "text",
          text: `Analyze this prompt for generating questions and variables: "${promptText}" 
          
First, DEEPLY ANALYZE the intent behind this prompt to understand what the user is trying to accomplish.

Then, provide a BRIEF description of the image (max 2 paragraphs). Focus ONLY on what's directly visible and ONLY mention aspects that are relevant to the prompt.${imageInstructionsText}

Then generate focused questions and variables with pre-filled values based on what you directly observe in the image that's MOST RELEVANT to the prompt.

IMPORTANT: After analyzing the image, identify what ADDITIONAL context is still needed from the user that is NOT visible in the image and create questions to gather that missing information. For example, if the image shows lighting but doesn't indicate purpose, ask questions about the intended use.

CRITICAL: All extracted information must be evaluated with the specific objective of constructing an AI-TOOL-READY PROMPT. Every piece of context must serve the end goal: generating a final prompt optimized for use with existing AI tools. This means focusing on details, parameters, and instructions that will result in an effective prompt that works well with AI systems.

SPLIT YOUR QUESTIONS INTO:
1. Questions answerable directly from the image (pre-fill these)
2. Questions that need user input (leave these blank)
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
    // No image, just use a simple text message with additional context
    console.log("No image provided - using text-only OpenAI API request");
    console.log("Additional context provided:", additionalContext ? "Yes" : "No");
    
    // Enhance user prompt with more specific instructions for intent analysis and content extraction
    let messageText = `Analyze this prompt for generating questions and variables: "${promptText}"

FIRST, DEEPLY ANALYZE the main intent behind this prompt. What is the user trying to accomplish? Is it content creation, image generation, research, marketing, coding, or something else?

CRITICAL: All extracted information must be evaluated with the specific objective of constructing an AI-TOOL-READY PROMPT. Every piece of context must serve the end goal: generating a final prompt optimized for use with existing AI tools. This means focusing on details, parameters, and instructions that will result in an effective prompt that works well with AI systems.`;
    
    if (additionalContext.includes("WEBSITE CONTEXT")) {
      messageText += `

${additionalContext}

When creating and pre-filling questions:
1. FOCUS ON THE ORIGINAL PROMPT'S INTENT - the website content should enhance, not replace it
2. Create questions that relate to the original prompt's purpose, not about the website itself
3. If the prompt is about creating something (like a landing page), questions should be about that creation process
4. Use the website content to provide detailed answers that support the original prompt's goals
5. Extract 1-2 full sentences of detailed information from the website for question answers
6. Include concrete facts, quotes or examples from the website that support the original prompt's purpose
7. If the user asked to extract specific information (like "best practices"), focus on those items as they relate to the original prompt
8. Remember: website content is supplementary research material for enhancing the original prompt, not the primary subject
9. CLEARLY IDENTIFY what additional context is still needed from the user that is NOT present in the website content
10. Create additional questions to gather the missing context from the user (leave these blank)
11. ENSURE all extracted information is optimized for creating an AI-tool-ready prompt`;
    } else if (additionalContext.includes("SMART CONTEXT DATA")) {
      messageText += `

${additionalContext}

When creating and pre-filling questions from Smart Context:
1. FOCUS ON THE ORIGINAL PROMPT'S INTENT - the smart context should enhance, not replace it
2. Create questions that relate to the original prompt's purpose, leveraging the smart context information
3. Use the smart context to provide detailed answers that support the original prompt's goals
4. Extract 1-2 full sentences of detailed information from the smart context for question answers
5. Include specific terminology, concepts, or examples from the smart context when relevant
6. CLEARLY IDENTIFY what additional context is still needed from the user that is NOT present in the smart context
7. Create additional questions to gather the missing context from the user (leave these blank)
8. ENSURE all extracted information is optimized for creating an AI-tool-ready prompt`;
    } else {
      messageText += ` ${additionalContext}`;
    }
    
    messages.push({
      role: 'user',
      content: messageText
    });
  }
  
  try {
    console.log("Calling OpenAI API with GPT-4o for prompt analysis...");
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using GPT-4o for analysis
        messages,
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
    
    console.log("Successfully analyzed prompt with GPT-4o");
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
