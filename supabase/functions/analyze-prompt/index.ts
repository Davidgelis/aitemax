// ─────────────────────────────────────────────────────────────
// Pillar-aware question bank  (feel free to extend later)
// ─────────────────────────────────────────────────────────────
const pillarSuggestions = (pillar: string, promptSnippet = "") => {
  const short = promptSnippet.length > 60
    ? promptSnippet.slice(0, 57) + "…"
    : promptSnippet;

  const p = pillar.toLowerCase();
  if (p.includes('mood')) return [
    { txt: "What feeling should the image evoke?", ex: ['playful', 'serene', 'dramatic'] },
    { txt: "Is the mood subtle or bold?",            ex: ['soft pastels', 'vibrant neon', 'gritty noir'] },
    { txt: "What is the main intention of the image?", ex: ['social ad', 'personal gift', 'storytelling'] }
  ];
  if (p.includes('style')) return [
    { txt: "Which visual style best fits?",           ex: ['water-colour', 'comic', 'photorealistic'] },
    { txt: "Do you prefer a specific era or genre?",  ex: ['80s retro', 'futuristic', 'baroque'] },
    { txt: "Any colour palette constraints?",         ex: ['brand colours', 'monochrome', 'pastel set'] }
  ];
  if (p.includes('environment')) return [
    { txt: "Where is the scene set?",                 ex: ['beach', 'city park', 'outer space'] },
    { txt: "Time of day or season?",                  ex: ['sunset', 'winter morning', 'mid-day'] },
    { txt: "Should the background be detailed or minimal?", ex: ['detailed', 'clean white', 'blurred'] }
  ];
  if (p.includes('subject')) return [
    { txt: "What is the main subject's pose or action?", ex: ['running', 'sitting', 'jumping'] },
    { txt: "Any composition guidelines?",             ex: ['rule-of-thirds', 'centre focus', 'symmetry'] },
    { txt: "Camera angle preference?",                ex: ["eye level", "bird's-eye", "low angle"] }
  ];

  // default – weave the user's intent into the question
  const obj = short        // e.g. "an image of a dog playing…"
               .replace(/^create\s+(an|a)?\s*/i, '')  // trim verbs
               .replace(/^\w+\s+of\s+/i, '');         // "image of …" → "…"

  return [
    {
      txt: `For **${obj}**, what ${pillar.toLowerCase()} details are still missing?`,
      ex: []   // examples get added later by addFallbackExamples()
    }
  ];
};

//------------------------------------------------------------------
// 🔸 modernised helpers  (merged old + new logic) 
//------------------------------------------------------------------
const MAX_EXAMPLES = 4;
const STOP        = new Set(["of","the","a","an"]);

/**
 * Normalize question text:
 *  • replace "resolution/dpi/rgb/hex" → "colour"  
 *  • "n image" → "an image"  
 *  • strip any trailing "(…examples…)" that LLM may have appended  
 */
const plainify = (t = "") =>
  t
    .replace(/resolution|dpi|rgb|hex/gi, "colour")
    .replace(/\bn\s+image\b/gi, "an image")
    // remove any trailing parentheses and their contents
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();

/**
 * Just trim the examples array to MAX_EXAMPLES.
 * We no longer shove them into `q.text`—the UI will toggle them out of `q.examples`.
 */
const ensureExamples = (q: any) => {
  if (!Array.isArray(q.examples)) {
    return { ...q, examples: [] };
  }
  return { ...q, examples: q.examples.slice(0, MAX_EXAMPLES) };
};

//────────  variable post-processing  ────────────
const processVariables = (vars: any[]) => {
  const canonical = (l: string) =>
    l.toLowerCase().split(/\s+/).filter(w => !STOP.has(w)).sort().join(" ");

  let v = vars.map((x: any) => ({
    ...x,
    name : (x.name  || "").trim().split(/\s+/).slice(0, 3).join(" "),
    value: (x.value || "").trim().split(/\s+/).slice(0, 3).join(" "),
    category: x.category || "Other"
  }));
  const seen = new Set<string>();
  v = v.filter(x => {
    const sig = canonical(x.name);
    if (!sig || seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
  return v.slice(0, 8);
};

//────────  auto-answer questions from Vars / Vision tags  ─────────
const fillQuestions = (qs: any[], vars: any[], imgTags: Record<string, string> = {}) => {
  const has = (s?: string) => s && s.trim().length > 0;
  const tagTest = {
    palette   : /(palette|colour|color)/i,
    style     : /(style|aesthetic|genre|art\s*style)/i,
    mood      : /(mood|tone|feeling|emotion)/i,
    background: /(background|setting|environment|scene)/i,
    subject   : /(subject|object|figure|person)/i
  };
  return qs.map(q => {
    if (q.answer) return q;
    const hit = vars.find(v => v.value && q.text.toLowerCase().includes(v.name.toLowerCase()));
    if (hit) return { ...q, answer: hit.value, prefillSource: hit.prefillSource };

    for (const [tag, re] of Object.entries(tagTest)) {
      if (re.test(q.text) && has(imgTags[tag])) {
        return { ...q, answer: imgTags[tag], prefillSource: "image-tag" };
      }
    }
    return q;
  });
};

//------------------------------------------------------------------
//  ✨ concise "user-intent" extractor (from previous patch)
//------------------------------------------------------------------
const extractUserIntent = (txt = ""): string => {
  if (txt.length < 60) return txt.trim();
  const firstSentence = txt.split(/[.!?]/).find(s => s.trim().length > 20);
  if (firstSentence) return firstSentence.trim();
  return txt.split(/\s+/).slice(0, 12).join(" ").trim();
};

//--------------------------------------------------------------------
// MAIN EDGE FUNCTION HANDLER
//--------------------------------------------------------------------
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  analyzePromptWithAI,
  describeImage,
  describeAndMapImage,
  inferAndMapFromContext,
  canonKey
} from "./openai-client.ts";
import { createSystemPrompt } from "./system-prompt.ts";
import { generateContextQuestionsForPrompt, generateContextualVariablesForPrompt } from "./utils/generators.ts";
import { computeAmbiguity, organizeQuestionsByPillar } from "./utils/questionUtils.ts";

// Define types
interface Question {
  id: string;
  text: string;
  answer?: string;
  isRelevant: boolean;
  category?: string;
  contextSource?: string;
  examples?: string[];
}

interface Variable {
  id: string;
  name: string;
  value: string;
  isRelevant: boolean;
  category?: string;
  code?: string;
}

interface AnalyzePromptResponse {
  questions: Question[];
  variables: Variable[];
  masterCommand: string;
  enhancedPrompt: string;
  ambiguityLevel?: number;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { promptText, userId, promptId, template, model, imageData, websiteData, smartContextData } = await req.json();
    
    if (!promptText || typeof promptText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid promptText parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Analyzing prompt with model: ${model || 'default'}`);
    
    const ambiguityLevel = computeAmbiguity(promptText);
    
    let imageCaption = "";
    let imageAnalysis = null;
    
    if (imageData && Array.isArray(imageData) && imageData.length > 0) {
      try {
        const firstImageWithBase64 = imageData.find(img => img.base64);
        
        if (firstImageWithBase64) {
          imageCaption = await describeImage(firstImageWithBase64.base64)
            .then(result => result.caption || "")
            .catch(() => "");
          
          console.log("Generated image caption for analysis");
        }
      } catch (err) {
        console.error("Error processing image data:", err);
      }
    }
    
    // 1) incorporate usageInstructions into the system prompt
    const usageInstr = smartContextData?.usageInstructions?.trim();
    const systemPrompt = [
      createSystemPrompt(template, imageCaption),
      usageInstr ? `\n\nUsage Instructions:\n${usageInstr}` : ""
    ].join("\n");
    
    const openAIResult = await analyzePromptWithAI(
      promptText,
      systemPrompt,
      model || 'gpt-4.1',
      smartContextData?.context || '',
      imageData && imageData[0]?.base64
    ).catch(err => {
      console.error("OpenAI analysis error:", err);
      return null;
    });
    
    //---------------------------------------------------------------
    //  NEW QUESTION & VARIABLE GENERATION (step 1–3)
    //---------------------------------------------------------------

    // 1️⃣ Extract the user's main intent from their prompt
    const userIntent = extractUserIntent(promptText);

    // 2️⃣ Generate all questions via your contextual generator
    let questions: Question[] = generateContextQuestionsForPrompt(
      promptText,
      template,
      smartContextData,
      imageAnalysis,
      userIntent
    ).map((q: any, i: number) => ({
      id:         q.id    || `q-${i+1}`,
      text:       q.text,
      answer:     "",
      isRelevant: true,
      examples:   Array.isArray(q.examples) ? q.examples.slice(0, MAX_EXAMPLES) : [],
      category:   q.category || (template?.pillars?.[i]?.title as string) || "General"
    }));

    // 3️⃣ Generate all variables via your contextual generator
    let variables: Variable[] = generateContextualVariablesForPrompt(
      promptText,
      template,
      imageAnalysis,
      smartContextData
    );

    // 4️⃣ Remove any variable whose name is already asked by a question
    const qTexts = questions.map(q => q.text.toLowerCase());
    variables = variables.filter(v =>
      !qTexts.some(text => text.includes(v.name.toLowerCase()))
    );

    // 5️⃣ Apply your usual post-processing (dedupe, cap at 8)
    variables = processVariables(variables);

    // ──────────────────────────────────────────────────
    // extract any trailing "(ex1, ex2, ex3)" into our .examples array
    questions = questions.map(q => {
      const m = q.text.match(/\(([^)]+)\)\s*$/);
      if (m) {
        const exs = m[1]
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .slice(0, MAX_EXAMPLES);
        const cleaned = q.text.replace(/\s*\([^)]*\)\s*$/, '').trim();
        return { ...q, text: cleaned, examples: exs };
      }
      return q;
    });
    // ──────────────────────────────────────────────────

    //──────────────  VARIABLE creation + pre-fill steps  ──────────────
    
    // 1️⃣ If the LLM returned variables, merge them with ours
    if (openAIResult?.parsed?.variables && Array.isArray(openAIResult.parsed.variables)) {
      const llmVars: any[] = openAIResult.parsed.variables;
      // Update existing variables
      variables = variables.map(v => {
        const match = llmVars.find(l => canonKey(l.name) === canonKey(v.name));
        if (!match) return v;
        return {
          ...v,
          // prefer LLM value if it exists
          value: match.value || v.value,
          prefillSource: match.prefillSource || v.prefillSource,
          code:         match.code         || v.code,
          category:     match.category     || v.category
        };
      });
      // Add variables that LLM proposed but weren't in our fallback
      llmVars.forEach(l => {
        if (!variables.some(v => canonKey(v.name) === canonKey(l.name))) {
          variables.push({
            id:         `v-${variables.length + 1}`,
            name:       l.name,
            value:      l.value || "",
            isRelevant: true,
            category:   l.category || "General",
            code:       l.code     || canonKey(l.name),
            prefillSource: l.prefillSource
          });
        }
      });
    }
    
    // ─── Sanitize any boolean-y values & drop boilerplate "An image of" vars ───
    variables = variables
      // 1) Blank out bogus "yes"/"no" answers
      .map(v => ({
        ...v,
        value: ['yes','no'].includes(String(v.value).toLowerCase())
          ? ''
          : v.value
      }))
      // 2) Remove any var whose name literally starts with "an image of"
      .filter(v => {
        const n = v.name.trim().toLowerCase();
        return !n.startsWith('an image of');
      });
    
    // ----------  Image-based pre-fill (only style/palette/mood vars) ----------
    if (imageData && Array.isArray(imageData) && imageData.length > 0 && variables.length > 0) {
      try {
        const firstImageWithBase64 = imageData.find(img => img.base64);
        
        if (firstImageWithBase64) {
          // Get variable names to look for in the image
          const variableNames = variables.map(v => v.name);
          
          // Map image content to variables
          const imageMapping = await describeAndMapImage(firstImageWithBase64.base64, variableNames);
          
          if (imageMapping && imageMapping.fill) {
            // Update variables with values from image analysis
            variables = variables.map(v => {
              // only prefill style/palette/color/mood variables
              const cat = (v.category || "").toLowerCase();
              if (!/(style|colour|color|palette|mood|aesthetic)/.test(cat)) {
                return v;
              }
              const match = imageMapping.fill[v.name];
              if (match && match.value) {
                return {
                  ...v,
                  value: match.value,
                  prefillSource: "image"
                };
              }
              return v;
            });
          }
        }
      } catch (err) {
        console.error("Error mapping image content to variables:", err);
        // Continue with original variables
      }
    }
    
    // ----------  Context-based pre-fill  ----------
    const blanks = variables.filter(v => !v.value);
    if (blanks.length) {
      const names   = blanks.map(v => v.name);
      const bigCtx  = [
        promptText,
        smartContextData?.context || "",
        websiteData?.pageText || ""
      ].join("\n\n").trim();
      try {
        const map = await inferAndMapFromContext(bigCtx, names);
        variables = variables.map(v => {
          const hit = Object.entries(map?.fill || {})
            .find(([k]) => canonKey(k) === canonKey(v.name))?.[1];
          return hit && hit.value
            ? { ...v, value: hit.value, prefillSource: "context" }
            : v;
        });
      } catch(_) {/* non-fatal */}
    }

    // ───────────────────────────────────────────────────────────────
    // 1) De-dupe any variable whose name exactly matches a question prompt
    const lowerQ = questions.map(q => q.text.toLowerCase());
    variables = variables.filter(v => {
      const nv = v.name.trim().toLowerCase();
      return !lowerQ.some(qt => qt.includes(nv));
    });

    // 2) Plain-language-ify each variable name & any prefilled value
    variables = variables.map(v => ({
      ...v,
      name:   plainify(v.name),
      value:  plainify(v.value || "")
    }));

    // Final tidy-up
    variables = processVariables(variables);
    // Remove any variable whose value simply repeats its name (unhelpful prefill)
    variables = variables.map(v => {
      if (v.value && v.name && v.value.trim().toLowerCase() === v.name.trim().toLowerCase()) {
        return { ...v, value: "" };
      }
      return v;
    });

    // Update categories in variables based on pillars
    variables = variables.map(v => {
      if (!v.category || v.category === "General" || v.category === "Other") {
        // Try to match with a pillar
        const matchedPillar = template?.pillars?.find((p: any) => 
          v.name.toLowerCase().includes(p.title.toLowerCase())
        )?.title;
        return matchedPillar ? { ...v, category: matchedPillar } : v;
      }
      return v;
    });

    // ─── Auto-answer questions from variables & image tags ──────────
    // ----------  Auto-answer questions ----------
    const imgTags = imageCaption
      ? (await describeImage(imageData?.find((img: any) => img.base64)?.base64 || "")).tags || {}
      : {};
    
    // 2️⃣ Smart-Context-based question pre-fill
    if (smartContextData?.context) {
      // only for questions that aren't already answered
      const pending = questions.filter(q => !q.answer).map(q => q.text);
      if (pending.length) {
        const ctxMap = await inferAndMapFromContext(
          smartContextData.context,
          pending
        ).catch(() => null);
        if (ctxMap?.fill) {
          questions = questions.map(q => {
            if (!q.answer && ctxMap.fill[q.text]?.value) {
              return {
                ...q,
                answer: ctxMap.fill[q.text].value,
                prefillSource: 'context'
              };
            }
            return q;
          });
        }
      }
    }

    // then do your existing var/image-based auto-answer
    questions = fillQuestions(questions, variables, imgTags);

    // Determine questions per pillar based on missing variables  
    const varsByCategory: Record<string, typeof variables> = {};
    const questionsPerPillar: Record<string, number> = {};
    
    const pillars: string[] = Array.isArray(template?.pillars)
      ? template.pillars.map((p: any) => p.title)
      : [];
    
    pillars.forEach(pillar => {
      // Default counts based on ambiguity
      questionsPerPillar[pillar] = ambiguityLevel >= 0.6 ? 3 : 2;
    });
    
    // 5️⃣ FINAL: re-order & cap questions using your per-pillar counts
    questions = organizeQuestionsByPillar(questions, ambiguityLevel, questionsPerPillar)
      .map(q => {
        // 1) clean out any "(…examples…)" left in the text
        const cleanedText = plainify(q.text);
        // 2) trim their .examples to MAX_EXAMPLES
        return ensureExamples({ ...q, text: cleanedText });
      });
    
    let masterCommand = "";
    if (openAIResult && openAIResult.parsed && openAIResult.parsed.masterCommand) {
      masterCommand = openAIResult.parsed.masterCommand;
    } else {
      // Generate a simple master command
      masterCommand = `Generate a high-quality result based on: "${promptText.slice(0, 100)}${promptText.length > 100 ? '...' : ''}"`;
    }
    
    let enhancedPrompt = promptText;
    if (openAIResult && openAIResult.parsed && openAIResult.parsed.enhancedPrompt) {
      enhancedPrompt = openAIResult.parsed.enhancedPrompt;
    }
    
    const response: AnalyzePromptResponse = {
      questions,
      variables,
      masterCommand,
      enhancedPrompt,
      ambiguityLevel
    };
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze prompt',
        questions: [],
        variables: [],
        masterCommand: "",
        enhancedPrompt: ""
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
