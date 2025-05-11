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

const plainify = (t = "") =>
  t.replace(/resolution|dpi|rgb|hex/gi, "colour")
   .replace(/\bn\s+image\b/gi, "an image")
   .trim();

const ensureExamples = (q: any) => {
  if (!Array.isArray(q.examples) || !q.examples.length) return q;
  const ex = q.examples.slice(0, MAX_EXAMPLES).join(", ");
  return /\(.+\)$/.test(q.text) ? q : { ...q, text: `${q.text} (${ex})` };
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
  // Implementation of the analyze-prompt function
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  // Handle CORS preflight requests
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
    
    // Calculate ambiguity of the prompt
    const ambiguityLevel = computeAmbiguity(promptText);
    
    // Generate the system prompt for OpenAI
    let imageCaption = "";
    let imageAnalysis = null;
    
    // Process image data for context if available
    if (imageData && Array.isArray(imageData) && imageData.length > 0) {
      try {
        // Get the first image with a valid base64
        const firstImageWithBase64 = imageData.find(img => img.base64);
        
        if (firstImageWithBase64) {
          // Get image caption
          imageCaption = await describeImage(firstImageWithBase64.base64)
            .then(result => result.caption || "")
            .catch(() => "");
          
          console.log("Generated image caption for analysis");
        }
      } catch (err) {
        console.error("Error processing image data:", err);
        // Continue without image caption
      }
    }
    
    const systemPrompt = createSystemPrompt(template, imageCaption);
    
    // Query OpenAI for analysis
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
    
    // ───────────────────────────────────────────────
    // 1️⃣ Try to use LLM-returned questions—but **drop** any generic "For **…**, what … details are still missing? ()" fallbacks
    let questions: Question[] = [];

    if (openAIResult?.parsed?.questions) {
      // filter out the completely-empty fallback questions
      const rawQs = (openAIResult.parsed.questions as any[])
        .filter(q =>
          // keep it if it has examples OR does *not* match our generic fallback pattern
          (Array.isArray(q.examples) && q.examples.length > 0)
            || !/^For \*\*.+\*\*, what .+\?\s*\(\)$/.test(q.text)
        );

      if (rawQs.length > 0) {
        questions = rawQs.map((q: any, i: number) => ({
          id: `q-${i + 1}`,
          text: q.text   || q.question   || "",
          answer: "",
          isRelevant: true,
          examples: q.examples || [],
          category: q.category || "General"
        }));
      }
    }

    // 2️⃣ If after filtering we have nothing, generate truly contextual questions
    if (questions.length === 0) {
      const userIntent = extractUserIntent(promptText);
      questions = generateContextQuestionsForPrompt(
        promptText,
        template,
        smartContextData,
        imageAnalysis,
        userIntent
      );
    }

    //──────────────── 1️⃣ Pillar-aware re-ordering & (re-)annotate examples ────
    questions = organizeQuestionsByPillar(questions, ambiguityLevel)
      .map(q => ensureExamples({ ...q, text: plainify(q.text) }));

    // ──────────────────────── guarantee every template pillar is covered ───────────────────────
    const tplPillars = Array.isArray(template?.pillars)
      ? template.pillars.map((p: any) => p.title)
      : [];
    const have = new Set(questions.map(q => (q.category || "Other").toLowerCase()));
    const userIntent = extractUserIntent(promptText);

    tplPillars.forEach(p => {
      if (!have.has(p.toLowerCase())) {
        // always exactly one fallback per pillar
        const [s] = pillarSuggestions(p, userIntent);
        // build parentheses only if we have any examples
        const exStr = Array.isArray(s.ex) && s.ex.length
          ? ` (${s.ex.slice(0, MAX_EXAMPLES).join(", ")})`
          : "";

        questions.push({
          id: `q_auto_${canonKey(p)}`,
          text: s.txt + exStr,
          category: p,
          answer: "",
          isRelevant: true,
          examples: s.ex
        });
      }
    });
    
    //──────────────────  VARIABLE creation + pre-fill steps  ──────────────
    let variables: Variable[] = [];
    
    if (openAIResult && openAIResult.parsed && Array.isArray(openAIResult.parsed.variables)) {
      // Map OpenAI results to our Variable structure
      variables = openAIResult.parsed.variables.map((v: any, index: number) => ({
        id: `v-${index + 1}`,
        name: v.name || "",
        value: v.value || "",
        isRelevant: true,
        category: v.category || "General",
        code: v.code || v.name?.toLowerCase().replace(/\s+/g, '_') || ""
      }));
    } else {
      // Fallback to our own variable generation
      variables = generateContextualVariablesForPrompt(promptText, template, imageAnalysis, smartContextData);
    }
    
    // ----------  Image-based pre-fill  ----------
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
              const match = imageMapping.fill[v.name];
              if (match && match.value) {
                return {
                  ...v,
                  value: match.value,
                  contextSource: 'image'
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

    // Final tidy-up
    variables = processVariables(variables);

    // ----------  Auto-answer questions ----------
    const imgTags = imageCaption
      ? (await describeImage(firstImageWithBase64?.base64 || "")).tags || {}
      : {};

    questions = fillQuestions(questions, variables, imgTags);
    
    // Extract or generate master command
    let masterCommand = "";
    if (openAIResult && openAIResult.parsed && openAIResult.parsed.masterCommand) {
      masterCommand = openAIResult.parsed.masterCommand;
    } else {
      // Generate a simple master command
      masterCommand = `Generate a high-quality result based on: "${promptText.slice(0, 100)}${promptText.length > 100 ? '...' : ''}"`;
    }
    
    // Generate or extract enhanced prompt
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
