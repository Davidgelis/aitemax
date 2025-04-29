
import { OpenAI } from "https://esm.sh/openai@4.26.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

if (!openAIApiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

function normaliseDataURL(b64: string, fallback = "jpeg") {
  // remove any accidental whitespace
  const cleaned = b64.replace(/\s+/g, "");

  if (cleaned.startsWith("data:image/")) {
    // Canonicalise jpg → jpeg
    return cleaned.replace(/^data:image\/jpg;base64,/i,
                           "data:image/jpeg;base64,");
  }
  // raw base-64 → wrap it
  return `data:image/${fallback};base64,${cleaned}`;
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
    console.log(`Processing prompt with model: ${model}`);

    // Updated models whitelist to include GPT-4.1 as priority
    const ALLOWED = new Set(['gpt-4.1', 'gpt-4o', 'gpt-4o-mini']);
    if (!ALLOWED.has(model)) {
      console.warn(`[AI] model "${model}" not enabled; falling back to gpt-4.1`);
      model = 'gpt-4.1';
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
    console.log(`Using model: ${model} for analysis`);
      
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content }
    ];

    // Add image if available, but skip if too large
    if (imageBase64 && imageBase64.length < 650_000) {
      const asDataURL = normaliseDataURL(imageBase64);

      // Accept only png / jpg / jpeg / webp / gif
      const ok = /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(asDataURL);
      if (ok) {
        console.log("Including image in OpenAI request");
        messages[1].content = [
          { type: "text", text: content },
          { type: "image_url", image_url: { url: asDataURL } }
        ];
      } else {
        console.warn("🛑  Unsupported image mime – skipping image for chat call");
      }
    } else if (imageBase64) {
      console.warn("Image omitted – payload was redacted client side");
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

// ─────────────────────────────────────────────────────────────────────────
//  HELPER: call vision endpoint once to get a 1-paragraph description
// ─────────────────────────────────────────────────────────────────────────
export async function describeImage(
  base64: string
): Promise<{ caption: string; tags: Record<string, string> }> {
  try {
    const openai = new OpenAI({
      apiKey: openAIApiKey
    });
    
    const sys = `You are a vision assistant. 
Return valid JSON with:
  - caption  : one descriptive paragraph
  - tags     : an object whose keys are
      subject, style, palette, background, mood (use "" if unknown)`;
    
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 120,
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${base64}` }
            },
            { type: "text", text: "Describe this image" }
          ]
        }
      ]
    });
    
    const raw = res.choices[0].message.content.replace(/```json|```/g,'').trim();
    return JSON.parse(raw);
  } catch (err) {
    console.log("⚠️  Vision call failed, continuing without image caption →", err);
    return { caption: "", tags: {} };
  }
}
