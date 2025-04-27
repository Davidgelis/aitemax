import { OpenAI } from "https://esm.sh/openai@4.26.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

if (!openAIApiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

export async function analyzePromptWithAI(
  promptText: string,
  systemPrompt: string,
  model: string = 'gpt-4o',
  additionalContext: string = '',
  imageBase64: string | null = null
) {
  const openai = new OpenAI({
    apiKey: openAIApiKey
  });

  try {
    console.log(`Processing prompt with model: ${model}`);

    if (model !== 'gpt-4o' && model !== 'gpt-4o-mini' && model !== 'gpt-4.1-2025-04-14') {
      console.warn(`Invalid model specified: ${model}, defaulting to gpt-4o`);
      model = 'gpt-4o';
    }

    // Optimize content by truncating extremely long text
    const maxAdditionalContextLength = 4000; // Limit additional context length
    const optimizedAdditionalContext = additionalContext && additionalContext.length > maxAdditionalContextLength 
      ? additionalContext.substring(0, maxAdditionalContextLength) + "... [truncated]"
      : additionalContext;
      
    const content = optimizedAdditionalContext 
      ? `${promptText}\n\nAdditional context: ${optimizedAdditionalContext}` 
      : promptText;
      
    console.log(`Final content length being sent to OpenAI: ${content.length} characters`);
      
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content }
    ];

    // Add image if available, but optimize its size
    if (imageBase64) {
      console.log("Including image data in request");
      messages[1].content = [
        { type: "text", text: content },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ];
    }

    // Use promise timeout instead of the timeout parameter
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out after 30 seconds")), 30000);
    });
    
    const apiPromise = openai.chat.completions.create({
      model: model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    });
    
    console.log(`Sending request to OpenAI with model: ${model}`);
    
    // Race the API call against the timeout
    const completion = await Promise.race([apiPromise, timeoutPromise]) as any;
    
    console.log(`Received response from OpenAI using model: ${model}`);
    
    // Extract the response content
    const responseContent = completion.choices[0].message.content || "";
    
    // Remove any markdown formatting that might be present (like ```json)
    let cleanedContent = responseContent.replace(/```json\n|\n```|```/g, "").trim();
    
    // Make sure it's valid JSON
    try {
      JSON.parse(cleanedContent);
      console.log("Successfully parsed JSON response.");
    } catch (e) {
      console.error("Invalid JSON response:", cleanedContent);
      console.error("Error parsing JSON:", e.message);
      throw new Error("Failed to parse response as JSON");
    }
    
    return completion.choices[0].message;
  } catch (error) {
    console.error(`Error in analyzePromptWithAI using model ${model}:`, error);
    throw error;
  }
}
