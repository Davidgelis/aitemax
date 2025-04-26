
import { OpenAI } from "https://esm.sh/openai@4.26.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

if (!openAIApiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

export async function analyzePromptWithAI(
  promptText: string,
  systemPrompt: string,
  model: string = 'gpt-4.1',
  additionalContext: string = '',
  imageBase64: string | null = null
) {
  const openai = new OpenAI({
    apiKey: openAIApiKey
  });

  try {
    console.log(`Processing prompt with length: ${promptText.length} characters`);
    console.log(`Using OpenAI model: ${model}`);

    const content = additionalContext 
      ? `${promptText}\n\nAdditional context: ${additionalContext}` 
      : promptText;
      
    console.log(`Final content length being sent to OpenAI: ${content.length} characters`);
    
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content }
    ];

    // Add image if available
    if (imageBase64) {
      messages[1].content = [
        { type: "text", text: content },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ];
    }

    const completion = await openai.chat.completions.create({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

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
    console.error("Error in analyzePromptWithAI:", error);
    throw error;
  }
}
