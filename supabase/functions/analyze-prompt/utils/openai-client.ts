import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { load } from "https://deno.land/std@0.218.0/dotenv/mod.ts";
import { extractMeaningfulElements } from "./utils/extractors.ts";

const env = await load();

const openAIKey = Deno.env.get("OPENAI_API_KEY") || env["OPENAI_API_KEY"];
if (!openAIKey) {
  console.warn("OPENAI_API_KEY not found. Image analysis will be disabled.");
}

const openai = new OpenAI({ apiKey: openAIKey });

// -------------------------------------------------------------------
//  HELPERS
// -------------------------------------------------------------------
const normaliseDataURL = (dataURL = "") => {
  if (!dataURL.includes("data:image/")) return dataURL;
  // strip EXIF data (rotates images)
  return dataURL.replace(/exif=[^&]+&?/gi, "");
};

// -------------------------------------------------------------------
//  VISION API
// -------------------------------------------------------------------
async function describeImage(imageBase64 = "") {
  if (!openAIKey) {
    console.warn("Skipping image description – no OpenAI key");
    return null;
  }
  try {
    const asDataURL = normaliseDataURL(imageBase64);
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image in detail." },
            {
              type: "image_url",
              image_url: { url: asDataURL, detail: "high" },
            },
          ],
        },
      ],
    });
    const caption = response.choices[0]?.message?.content || "";
    const tags = await tagImage(caption);
    return { caption, tags };
  } catch (err) {
    console.error("OpenAI image description error:", err);
    return null;
  }
}

async function tagImage(caption = "") {
  if (!openAIKey) {
    console.warn("Skipping image tagging – no OpenAI key");
    return {};
  }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content:
            `Analyze the following text and extract any tags related to style, palette, mood, background, and subject.
Respond with a JSON object where each of those keys contains a comma-separated list of tags.

TEXT:
${caption}`,
        },
      ],
    });
    const json = response.choices[0]?.message?.content || "{}";
    try {
      return JSON.parse(json);
    } catch (err) {
      console.warn("Invalid JSON from tagImage:", json);
      return {};
    }
  } catch (err) {
    console.error("OpenAI image tagging error:", err);
    return {};
  }
}

async function describeAndMapImage(imageBase64 = "", keys: string[] = []) {
  if (!openAIKey) {
    console.warn("Skipping image analysis – no OpenAI key");
    return null;
  }
  try {
    const asDataURL = normaliseDataURL(imageBase64);
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                `Analyze this image and extract values for the following concepts.
If a concept cannot be determined, leave it blank.

${keys.map((k) => `- ${k}`).join("\n")}`,
            },
            {
              type: "image_url",
              image_url: { url: asDataURL, detail: "high" },
            },
          ],
        },
      ],
    });
    const content = response.choices[0]?.message?.content || "";
    const fill: Record<string, { value: string; valueLong?: string }> = {};
    const lines = content.split("\n").filter(Boolean);
    for (const line of lines) {
      const m = line.match(/^- (.+?): (.+)$/);
      if (m) {
        const k = m[1].trim();
        const v = m[2].trim();
        if (keys.includes(k)) {
          fill[k] = { value: v };
        }
      }
    }
    return { fill };
  } catch (err) {
    console.error("OpenAI image mapping error:", err);
    return null;
  }
}

// -------------------------------------------------------------------
//  TEXT COMPLETION API
// -------------------------------------------------------------------
async function analyzePromptWithAI(content, systemPrompt, model, additionalContext = '', imageBase64 = null) {
    if (!openAIKey) {
        console.warn("Skipping prompt analysis – no OpenAI key");
        return null;
    }
    const messages: any[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: content }
    ];
    if (additionalContext) {
        messages[1].content += `\n\nCONTEXT:\n${additionalContext}`;
    }

    // Add image if available, skip if too large (<= 650 KB allowed)
    if (imageBase64 && imageBase64.length <= 650_000) {
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
      console.warn("Image omitted from OpenAI request due to size constraints");
    }

    const apiPromise = openai.chat.completions.create({
        model: model || "gpt-4.1",
        messages,
        temperature: 0.0,
        max_tokens: 1200,
    });
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("OpenAI call timed out")), 25000)
    );

    const completion = await Promise.race([apiPromise, timeoutPromise]) as any;
    
    const result = completion?.choices?.[0]?.message?.content;
    if (!result) {
        console.warn("Invalid OpenAI result:", completion);
        return { parsed: { _INVALID_RESPONSE_: true } };
    }
    try {
        return { parsed: JSON.parse(result) };
    } catch (err) {
        console.warn("Invalid JSON from OpenAI:", result);
        return { parsed: { _INVALID_RESPONSE_: true } };
    }
}

// -------------------------------------------------------------------
//  CONTEXT API
// -------------------------------------------------------------------
async function inferAndMapFromContext(
  context: string,
  keys: string[]
): Promise<{ fill: Record<string, { value: string; valueLong?: string }> } | null> {
  if (!openAIKey) {
    console.warn("Skipping context inference – no OpenAI key");
    return null;
  }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content:
            `Given the following context, extract values for the following concepts.
If a concept cannot be determined, leave it blank.
CONTEXT:
${context}

CONCEPTS:
${keys.map((k) => `- ${k}`).join("\n")}`,
        },
      ],
      temperature: 0.0,
      max_tokens: 600,
    });
    const content = response.choices[0]?.message?.content || "";
    const fill: Record<string, { value: string; valueLong?: string }> = {};
    const lines = content.split("\n").filter(Boolean);
    for (const line of lines) {
      const m = line.match(/^- (.+?): (.+)$/);
      if (m) {
        const k = m[1].trim();
        const v = m[2].trim();
        if (keys.includes(k)) {
          // if (v.length > 100) {
          //   console.warn(`Value for ${k} is too long, truncating`);
          //   v = v.slice(0, 100);
          // }
          fill[k] = { value: v, valueLong: v };
        }
      }
    }
    return { fill };
  } catch (err) {
    console.error("OpenAI context mapping error:", err);
    return null;
  }
}

// -------------------------------------------------------------------
//  HTML EXTRACTION
// -------------------------------------------------------------------
async function extractTextFromWebsite(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      console.error(`Failed to parse HTML from ${url}`);
      return null;
    }
    const textContent = doc.body?.textContent || "";
    return textContent.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error(`Error extracting text from ${url}:`, error);
    return null;
  }
}

// -------------------------------------------------------------------
//  EXPORTS
// -------------------------------------------------------------------
export { analyzePromptWithAI, describeImage, describeAndMapImage, extractTextFromWebsite, inferAndMapFromContext };

export const canonKey = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, " ");

export const NO_HALLUCINATION_RULE =
  "When proposing variables, NEVER invent or guess values (e.g., dog breeds)...";

export const QUESTION_STYLE_RULE =
  "When asked to generate clarifying questions: write them in simple language,"+
  " reference the user's main subject where meaningful, and invite detailed answers"+
  " (so users type more than one word).";
