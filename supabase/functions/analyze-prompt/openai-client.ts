
import { OpenAI } from "https://esm.sh/openai@4.26.0";
import { shorten, clamp } from "./utils.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

if (!openAIApiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

export function canonKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
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
    
    const opts: Record<string, any> = {
      model,
      messages,
      temperature: 0.2,
      max_tokens: 2000,
    };

    // ⚠️  JSON-mode not supported when an image is present
    if (!imageBase64) opts.response_format = { type: "json_object" };

    const apiPromise = openai.chat.completions.create(opts);
    
    console.log(`Sending request to OpenAI with model: ${model}`);
    
    // Race the API call against the timeout
    const completion = await Promise.race([apiPromise, timeoutPromise]) as any;
    
    console.log(`Received response from OpenAI using model: ${model}`);
    
    // Extract the response content
    const responseContent = completion.choices[0].message.content || "";
    
    // Remove any markdown formatting that might be present (like ```json)
    let cleanedContent = responseContent.replace(/```json\n|\n```|```/g, "").trim();
    
    // Make sure it's valid JSON (graceful fallback to {})
    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch {
      if (cleanedContent.trim() === "") {
        console.warn("OpenAI returned empty content – continuing with {}");
        parsed = {};
      } else {
        console.error("Invalid JSON response:", cleanedContent);
        throw new Error("Failed to parse response as JSON");
      }
    }
    
    return { ...completion.choices[0].message, parsed }; // pass parsed up if needed
  } catch (error) {
    console.error(`Error in analyzePromptWithAI using model ${model}:`, error);
    throw error;
  }
}

export async function describeAndMapImage(
  base64: string,
  variableNames: string[]
) {
  try {
    const openai = new OpenAI({
      apiKey: openAIApiKey
    });
    
    // Clean base64 by removing data URL prefix if present
    if (base64.startsWith('data:image/')) {
      base64 = base64.split(',')[1];
    }
    
    const messages = [
      { role: "system", content:
        "You are a vision assistant. " +
        "Extract concise property values from the image." },
      // 📷  the image itself
      { role: "user",  content: [
          { type: "text",
            text: "Fill ONLY the variables you are confident about. " +
                 "Respond with raw *minified* JSON **without markdown fences**: " +
                 "{\"fill\":{<var>: {value:<string>, confidence:<0-1>}}}" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
          { type: "text", text: `Variable list: ${variableNames.join(" | ")}` }
      ]}
    ];

    console.log(`Sending image analysis request for ${variableNames.length} variables`);
    
    const { choices } = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0,
      messages
    });

    const content = choices[0].message.content || "{}";
    console.log(`Received vision response: ${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`);
    
    try {
      const cleaned = content
        .replace(/```json\n?/gi, "")
        .replace(/```/g, "")
        .trim();
        
      const parsed = JSON.parse(cleaned);
      
      // Fallback: if backend did not supply valueLong use value
      if (parsed.fill) {
        Object.values(parsed.fill).forEach((slot: any) => {
          if (!slot.valueLong) slot.valueLong = slot.value;
        });
        
        // Process the response to include both short and long values
        for (const varLabel in parsed.fill) {
          const hit = parsed.fill[varLabel];
          if (hit && hit.value) {
            const phrase = hit.value.trim().replace(/\s+/g, " ");
            parsed.fill[varLabel] = {
              value: clamp(phrase, 100),
              valueLong: phrase,
              confidence: hit.confidence
            };
          }
        }
      }
      
      return parsed;  // ⬅ { fill:{…} }
    } catch (error) {
      console.error("Failed to parse vision response:", error);
      return { fill: {} };  // leave variables empty
    }
  } catch (err) {
    console.log("⚠️ Vision mapping call failed, continuing without image prefills →", err);
    return { fill: {} };
  }
}

// ────────────────────────────────────────────────────────────────
//   inferAndMapFromContext – fills any variables from free text
// ────────────────────────────────────────────────────────────────
export async function inferAndMapFromContext(
  freeText: string,
  variableNames: string[]
){
  try {
    const openai = new OpenAI({ apiKey: openAIApiKey });

    const variableList = variableNames.join(" | ");

    const messages = [
      {
        role: "system",
        content:
          "You are an assistant that fills a slot list from ANY text.\n" +
          "Only answer variables you are ≥0.7 confident about.\n" +
          "Return **minified** JSON (no markdown fences):\n" +
          "{\"fill\":{<var>:{value:<string>,confidence:<0-1>}}}"
      },
      {
        role: "user",
        content:
          `Variable list: ${variableList}\n\n---\nCONTEXT START\n` +
          `${freeText}\nCONTEXT END`
      }
    ];

    const { choices } = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0,
      messages,
      /* 🛡 require valid JSON back */
      response_format: { type: "json_object" }
    });

    const raw = choices[0].message.content ?? "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    try {
      /* Some runs prepend stray whitespace or a BOM before "{".
         Strip anything that appears before the first brace.                */
      const safe = cleaned.replace(/^[^{]+/, "");
      const parsed = JSON.parse(safe);
      
      // Fallback: if backend did not supply valueLong use value
      if (parsed.fill) {
        Object.values(parsed.fill).forEach((slot: any) => {
          if (!slot.valueLong) slot.valueLong = slot.value;
        });
        
        // Process the response to include both short and long values
        for (const varLabel in parsed.fill) {
          const hit = parsed.fill[varLabel];
          if (hit && hit.value) {
            const phrase = hit.value.trim().replace(/\s+/g, " ");
            parsed.fill[varLabel] = {
              value: clamp(phrase, 100),
              valueLong: phrase,
              confidence: hit.confidence
            };
          }
        }
      }
      
      return parsed;
    } catch (e) {
      console.error("⚠️  inferAndMapFromContext → parse error", e);
      return { fill:{} };
    }
  } catch (err) {
    console.log("⚠️ Context mapping call failed, continuing without context prefills →", err);
    return { fill: {} };
  }
}

export async function describeImage(
  base64: string,
  instructions =
    `You are a vision assistant.
Return *valid minified JSON* with keys:
  caption : one descriptive paragraph
  tags    : { subject, style, palette, background, mood }.
If a tag is unknown use an empty string.`
): Promise<{ caption: string; tags: Record<string,string> }> {
  try {
    const openai = new OpenAI({
      apiKey: openAIApiKey
    });
    
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url",
              image_url: { url: `data:image/png;base64,${base64}` } },
            { type: "text", text: instructions }
          ]
        }
      ]
    });
    const cleaned = res.choices[0].message.content
                     .replace(/```json|```/g,"").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.log("⚠️ Vision call failed, continuing without image caption →", err);
    return { caption:"", tags:{} };
  }
}
