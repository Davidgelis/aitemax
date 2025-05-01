import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSystemPrompt } from "./system-prompt.ts";
import {
  analyzePromptWithAI,
  describeImage,
  describeAndMapImage,
  inferAndMapFromContext,
  canonKey
} from "./openai-client.ts";
import { shorten, clamp } from "./utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deduplicate variables helper
const dedupeVars = (vars: any[]) => {
  const seen = new Set<string>();
  return vars.filter(v => {
    const sig = canonKey(v.name);
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
};

// Enhanced ambiguity calculation function
function calculateAmbiguity(promptText: string): number {
  // Basic calculation based on word count
  const wordCount = promptText.split(/\s+/).length;
  
  // For very short prompts (fewer than 5 words), automatically set high ambiguity
  if (wordCount < 5) {
    return 0.8; // High ambiguity to ensure 3 questions per pillar
  }
  
  const baseAmbiguity = Math.max(0, 1 - Math.min(wordCount/20, 1));
  
  // Additional factors that might indicate ambiguity
  const hasSpecificDetails = /(\d+|specific|exact|precise)/i.test(promptText);
  const hasClearObjective = /(need|want|create|make|build|design)/i.test(promptText);
  
  // Adjust ambiguity based on additional factors
  let adjustedAmbiguity = baseAmbiguity;
  if (hasSpecificDetails) adjustedAmbiguity *= 0.8; // Reduce ambiguity if specific details present
  if (!hasClearObjective) adjustedAmbiguity *= 1.2; // Increase ambiguity if no clear objective
  
  // Ensure minimum ambiguity level for short prompts to get more questions
  if (wordCount < 10) {
    return Math.max(adjustedAmbiguity, 0.6); // Ensure at least 0.6 for short prompts
  }
  
  // Ensure ambiguity stays between 0 and 1
  return Math.max(0, Math.min(adjustedAmbiguity, 1));
}

// Question post-processing utilities
const MAX_EXAMPLES = 4;
const MAX_IMG_ANSWER = 1000;

const plainify = (text: string | null | undefined): string =>
  (text ?? "")
    .replace(/resolution|dpi|rgb|hex/gi, 'colour')
    .replace(/\bn\s+image\b/gi, 'an image')
    .trim();

const ensureExamples = (q: any) => {
  if (!Array.isArray(q.examples) || !q.examples.length) return q;
  const ex = q.examples.slice(0, MAX_EXAMPLES).join(', ');
  const withParens = /\(.+\)$/.test(q.text) ? q.text : `${q.text} (${ex})`;
  return { ...q, text: withParens };
};

// ── helper: fabricate examples when GPT omits them ──
const addFallbackExamples = (q: any, vars: any[]) => {
  // skip if the question already ends with (…)
  if (/\(.+\)$/.test(q.text)) return q;

  // try to build pillar-specific hints from variables
  const hints = vars
    .filter(v => (v.category || 'Other') === (q.category || 'Other'))
    .map(v => (v.value || v.name).split(/\s+/)[0]) // first word only
    .filter(Boolean)
    .slice(0, 3);

  // If no hints, pull two content-words from the question itself
  const ex = hints.length
    ? hints
    : q.text
        .split(/\W+/)
        .filter(w => w.length > 3)
        .slice(0, 2)
        .map(w => w.toLowerCase());

  return { ...q, text: `${q.text.replace(/\?$/, '')}? (${ex.join(', ')})` };
};

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

  // default generic - now contextual
  return [
    { 
      txt: `Thinking of "${short}", what key ${pillar.toLowerCase()} info is still missing?`,
      ex: [] // let addFallbackExamples fill real examples
    }
  ];
};

// Function to process variables with performance optimizations
function processVariables(variables: any[], questions: any[]) {
  console.time("variableProcessing");
  console.log(`Raw variables received: ${variables.length}`);

  // helper: canonical form (lower-case → remove stop-words → alphabetical)
  const stop = new Set(["of", "the", "a", "an"]);
  const canonical = (label: string) => label
    .toLowerCase()
    .split(/\s+/)
    .filter(w => !stop.has(w))
    .sort()
    .join(" ");

  // 1️⃣ Trim to max three words for both name and value
  const trimmedVariables = variables.map(v => {
    const full = (v.value || "").trim().replace(/\s+/g, " ");
    return {
      ...v,
      name: shorten(v.name, 3),     // keep labels concise
      value: clamp(full, 100),      // short – UI list, badge chips, etc.
      valueLong: full               // long  – for answers / tooltips
    };
  });
  console.log(`After trimming: ${trimmedVariables.length} variables`);

  // 2️⃣ Dedupe via canonical label
  const seen = new Set<string>();
  const dedupedVariables = trimmedVariables.filter(v => {
    if (!v.name) return false; // Skip variables with empty names
    const sig = canonical(v.name);
    if (seen.has(sig)) {
      console.log(`Removing duplicate variable → "${v.name}" (signature: ${sig})`);
      return false;
    }
    seen.add(sig);
    return true;
  });
  console.log(`After deduplication: ${dedupedVariables.length} variables`);

  // 3️⃣ Ensure category (default "Other")
  const categorizedVariables = dedupedVariables.map(v => ({ ...v, category: v.category || "Other" }));

  // 4️⃣ We *keep* every variable. Duplicates with questions will be fixed later
  let finalVariables = categorizedVariables;

  // 5️⃣ Cap at eight
  if (finalVariables.length > 8) {
    console.log(`Trimming variables from ${finalVariables.length} → 8`);
    finalVariables = finalVariables.slice(0, 8);
  }

  return { finalVariables, variableDistribution: {} }; // Distribution computed later
}

// 🔗 helper – copy-paste once
function fillQuestions(
  qs: any[],
  variables: any[],
  imgTags: Record<string,string> = {}
){
  const has = (s?:string)=>s && s.trim().length>0;

  // quick regex bank for Vision tags
  const tagTest = {
    palette    : /(palette|colour|color)/i,
    style      : /(style|aesthetic|genre|art\s*style)/i,
    mood       : /(mood|tone|feeling|emotion)/i,
    background : /(background|setting|environment|scene)/i,
    subject    : /(subject|dog|cat|person|object|figure)/i
  };

  return qs.map(q=>{
    if (q.answer) return q;                   // already filled

    /* ──────────────────────────────────────────────────────────────
       We NO LONGER copy long variable descriptions into answers.
       This keeps variables (technical slots) and question answers
       (human-readable paragraphs) completely separate.
       Answers now come only from Vision tags or later user input.
    ────────────────────────────────────────────────────────────── */

    // Try Vision tags first (they are crafted for full-paragraph answers)
    for (const [tag,re] of Object.entries(tagTest)) {
      if (re.test(q.text) && has(imgTags[tag])) {
        const raw   = imgTags[tag].trim();
        const words = raw.split(/\s+/);
        
        if (words.length < 3 && !raw.includes(".")) continue;

        const answer = clamp(raw, 1000);
        return { ...q, answer, prefillSource:"image-tag" };
      }
    }

    return q;                          // still unanswered → go to UI
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.time("totalProcessingTime");
  try {
    // Read request body as text first for better error handling
    let bodyText = "";
    try {
      bodyText = await req.text();
    } catch (textError) {
      console.error("Error reading request body as text:", textError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to read request body",
          details: textError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    // Check for empty request body
    if (!bodyText.trim()) {
      console.error("Received empty request body");
      return new Response(
        JSON.stringify({ 
          error: "Empty request body",
          questions: [],
          variables: [],
          masterCommand: "",
          enhancedPrompt: ""
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    // Parse JSON with explicit error handling
    let payload;
    try {
      payload = JSON.parse(bodyText);
      console.log("Successfully parsed request body JSON");
    } catch (parseError) {
      console.error("Error parsing request body as JSON:", parseError);
      console.error("First 500 characters of received body:", bodyText.slice(0, 500));
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body",
          details: parseError.message,
          bodyPreview: bodyText.slice(0, 100) + "..." + (bodyText.length > 100 ? " [truncated]" : ""),
          questions: [],
          variables: [],
          masterCommand: "",
          enhancedPrompt: ""
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Extract and validate required fields
    const { promptText, template, websiteData, imageData, smartContextData, model = 'gpt-4.1' } = payload || {};
    console.log(`Request received for model: ${model}`);
    console.log(`Prompt length: ${promptText?.length} characters`);
    console.log(`Prompt text: "${promptText?.substring(0, 100)}${promptText?.length > 100 ? "..." : ""}"`);
    console.log(`Image data: ${imageData ? (Array.isArray(imageData) ? imageData.length : 1) : 0} items`);
    
    // Validate input
    if (!promptText || typeof promptText !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: "Invalid prompt text",
          questions: [],
          variables: [],
          masterCommand: "",
          enhancedPrompt: ""
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // ─── pick first usable base64 ─────────────────────
    let firstImageBase64: string | null = null;
    if (Array.isArray(imageData) && imageData.length) {
      const candidate = imageData.find((i: any) => typeof i?.base64 === "string");
      if (candidate?.base64) {
        firstImageBase64 = candidate.base64;
        console.log(
          `Image base64 provided (${firstImageBase64.length} chars)`
        );
      }
    }
    
    // ── If firstImageBase64 present → attempt a single-shot caption ──
    let imageMeta: { caption: string; tags: Record<string,string> } | null = null;
    if (firstImageBase64) {
      // accept only png | jpeg | jpg | webp | gif to avoid 400s
      const ok = /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(firstImageBase64.slice(0,40));
      if (ok) {
        imageMeta = await describeImage(firstImageBase64.replace(/^data:image\/\w+;base64,/,""));
      } else {
        console.log("🛑  Unsupported image mime – skipping vision call");
      }
    }
    
    const systemPrompt = createSystemPrompt(template, imageMeta?.caption || "");
    console.log("System prompt created");
    
    try {
      console.time("aiAnalysisTime");
      
      const { content } = await analyzePromptWithAI(
        promptText,
        systemPrompt,
        model, // Pass the requested model (defaults to gpt-4.1)
        smartContextData?.context || '',
        null // ← ✅ keep JSON-mode active (removed firstImageBase64)
      );
      console.timeEnd("aiAnalysisTime");
      console.log("AI analysis completed");
      
      let parsed;
      let processedContent = content;
      if (content.includes('```json')) {
        processedContent = content.replace(/```json\n|\n```|```/g, '').trim();
      }
      
      try {
        parsed = JSON.parse(processedContent);
        console.log("Successfully parsed JSON response.");
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Content that failed to parse:', processedContent);
        throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
      }

      let questions = Array.isArray(parsed.questions) ? parsed.questions : [];
      console.log(`Raw questions count: ${questions.length}`);
      
      const ambiguityLevel = parsed.ambiguityLevel ?? 0.8;
      console.log(`LLM determined ambiguity level: ${ambiguityLevel}`);

      // Question post-processing with deduplication
      const qCanonical = (t: string) =>
        t.toLowerCase().replace(/[^\w\s]/g,'').replace(/\s+/g,' ').trim();

      const uniqSeen = new Set<string>();
      let processedQuestions = questions
        // drop invalid items *first*
        .filter(q => typeof q?.text === "string" && q.text.trim().length)
        // *then* normalise + add examples
        .map(q => ensureExamples({ ...q, text: plainify(q.text) }))
        .filter(q => {
          const sig = qCanonical(q.text);
          if (uniqSeen.has(sig)) {
            console.log(`Dropping duplicate question → "${q.text}"`);
            return false;
          }
          uniqSeen.add(sig);
          return true;
        });

      // Group by pillar
      const byPillar: Record<string, any[]> = {};
      processedQuestions.forEach(q => {
        const cat = q.category || 'Other';
        if (!byPillar[cat]) byPillar[cat] = [];
        byPillar[cat].push(q);
      });

      // Keep all unique questions up to 3 per pillar
      Object.keys(byPillar).forEach(cat => {
        byPillar[cat] = byPillar[cat].slice(0, 3);   // <-- hard-slice
      });

      processedQuestions = Object.values(byPillar).flat();

      // ── Safety-net upgraded: ensure **every pillar** has ≥ 1 q ──
      const templatePillars = Array.isArray(template?.pillars)
        ? template.pillars.map((p: any) => p.title)
        : [];

      templatePillars.forEach((pillar: string) => {
        const hasOne = processedQuestions.some(
          q => (q.category || "Other").toLowerCase() === pillar.toLowerCase()
        );
        if (!hasOne) {
          const need = ambiguityLevel >= 0.6 ? 3 : 1;    // 📈 3 if ambiguous
          pillarSuggestions(pillar, promptText).slice(0, need).forEach((s, idx) => {
            processedQuestions.push({
              id: `q_auto_${pillar.replace(/\s+/g, "_").toLowerCase()}_${idx+1}`,
              category: pillar,
              isRelevant: true,
              text: `${s.txt} (${s.ex.slice(0, MAX_EXAMPLES).join(', ')})`,
              examples: s.ex
            });
          });
          console.log(`🛠  Auto-inserted ${need} question(s) for missing pillar «${pillar}»`);
        }
      });

      // --------------------------------------------------------------
      //  Balance questions vs. variables when they target the same slot
      // --------------------------------------------------------------
      const stopWords = new Set(["of","the","a","an"]);
      const canon = (s: string) =>
        s.toLowerCase()
         .replace(/[^\w\s]/g, "")
         .split(/\s+/)
         .filter(w => !stopWords.has(w))
         .join(" ");

      const isDescriptive = (txt: string) => {
        const wc = txt.trim().split(/\s+/).length;
        if (wc > 8) return true;                           // long → descriptive
        return /(describe|explain|background|details|context|story|scenario|steps|process|goal|purpose)/i.test(txt);
      };

      let tempVars: any[] = Array.isArray(parsed.variables) ? parsed.variables : [];
      tempVars = tempVars.map(v => ({ ...v, name: v.name.trim() }));

      const questionKeep: boolean[] = new Array(processedQuestions.length).fill(true);
      const varKeep = new Array<boolean>(tempVars.length).fill(true);

      processedQuestions.forEach((q, qi) => {
        const qSig = canon(q.text.replace(/\?.*$/, ""));           // bare signature
        tempVars.forEach((v, vi) => {
          if (!varKeep[vi]) return;
          if (canon(v.name) === qSig) {
            const varHasValue = (v.value ?? "").trim().length > 0;

          /* Always keep the question so it can be pre-filled later;
             drop the duplicate variable instead. */
          varKeep[vi] = false;
        }
      });
    });

      // rebuild lists
      processedQuestions = processedQuestions.filter((_, i) => questionKeep[i]);
      tempVars = tempVars.filter((_, i) => varKeep[i]);

      // Process variables after question cleanup
      let { finalVariables } = processVariables(
        tempVars,
        processedQuestions
      );

      // Top-up if you still have < 8 variables (never exceeds 8)
      if (finalVariables.length < 8) {
        const need = 8 - finalVariables.length;
        const current = new Set(finalVariables.map(v => v.name.toLowerCase()));
        const extras = Array.from(new Set(promptText.match(/\b[A-Za-z]+\b/g) ?? []))
          .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase())
            && !current.has(w.toLowerCase()))
          .slice(0, need)
          .map((w,i) => ({
            id: `auto_${i}`,
            name: w.replace(/^\w/, c=>c.toUpperCase()),
            value: "",
            category: "Auto"
          }));
        finalVariables.push(...extras);
      }

      /* -------------------------------------------------
         FINAL GUARANTEE – unique labels after stop-words
      ------------------------------------------------- */
      const seen = new Set<string>();
      finalVariables = finalVariables.filter(v => {
        const sig = v.name.toLowerCase().replace(/\b(of|the|a|an)\b/g, '').trim();
        if (seen.has(sig)) {
          console.log(`🔁 removing post-top-up duplicate «${v.name}»`);
          return false;
        }
        seen.add(sig);
        return true;
      });

      // unique ids safeguard
      finalVariables.forEach((v, i) => {
        v.id = v.id || `var_${Date.now()}_${i}`;
      });

      // Compute variable distribution after possible top-up
      const variableDistribution = finalVariables.reduce<Record<string,number>>((acc,v)=>{
        const cat = v.category || "Other";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      // Debug aid: warn about any remaining question-variable overlaps
      finalVariables.forEach(v => {
        const dup = processedQuestions.find(q => 
          q.text.toLowerCase().includes(v.name.toLowerCase())
        );
        if (dup) {
          console.log(`⚠️  Question "${dup.text}" duplicates variable "${v.name}"`);
          // prefer descriptive question, drop variable silently
          const idx = finalVariables.findIndex(x => x.id === v.id);
          if (idx !== -1) finalVariables.splice(idx, 1);
        }
      });

      // give every question illustrative examples
      processedQuestions = processedQuestions.map(q =>
        addFallbackExamples(q, finalVariables)
      );

      //------------------------------------------------------------------
      // Two-pass pre-fill system: Vision pass and Context pass
      //------------------------------------------------------------------
      
      //------------------------------------------------------------------
      // PASS 1 – Vision  (runs only when we actually have an image)
      //------------------------------------------------------------------
      if (firstImageBase64 && finalVariables.length) {
        const labels = finalVariables.map(v => v.name);
        const picMap = await describeAndMapImage(firstImageBase64, labels);

      /* ── Build a 5-bucket tag map from Vision slots ── */
      const visionTags: Record<string,string> = {};
      for (const [key, slot] of Object.entries(picMap?.fill ?? {})) {
        const val = (slot as any)?.value ?? "";
        /* keep snippets that are at least 3 words OR contain a period */
        if (!val || (val.split(/\s+/).length < 3 && !val.includes("."))) continue;

        const k = key.toLowerCase();
        if (/palette|colour|color/.test(k))        visionTags.palette    = val;
        else if (/style|aesthetic|genre/.test(k))  visionTags.style      = val;
        else if (/mood|tone|feeling/.test(k))      visionTags.mood       = val;
        else if (/background|environment/.test(k)) visionTags.background = val;
        else if (/subject|dog|cat|person/.test(k)) visionTags.subject    = val;
      }

      /* merge with caption-based tags so fillQuestions() sees everything */
      imageMeta = {
        caption: imageMeta?.caption ?? "",
        tags: { ...(imageMeta?.tags ?? {}), ...visionTags }
      };

      finalVariables = dedupeVars(finalVariables.map(v => {
        const visionHit = Object.entries(picMap?.fill ?? {})
          .find(([k]) => canonKey(k) === canonKey(v.name))?.[1];
          
          return (visionHit && visionHit.confidence >= 0.7 && visionHit.value?.length)
            ? { ...v, value: visionHit.value, valueLong: visionHit.valueLong, prefillSource: "image" }
            : v;
        }));
      }

      //------------------------------------------------------------------
      // PASS 2 – Media-agnostic GPT pre-fill  (always runs)
      //------------------------------------------------------------------
      const blanks = finalVariables.filter(v => !v.value);
      if (blanks.length) {
        const names = blanks.map(v => v.name);

        /* 👇  bundle *all* auxiliary text here: the original prompt,
              web-scraped context, OCR/Whisper transcripts … */
        const ctx = [
          promptText,
          smartContextData?.context || "",
          websiteData?.pageText      || ""
        ].join("\n\n").trim();

        const map = await inferAndMapFromContext(ctx, names);

        finalVariables = dedupeVars(finalVariables.map(v => {
          const ctxHit = Object.entries(map?.fill ?? {})
            .find(([k]) => canonKey(k) === canonKey(v.name))?.[1];
          
          return (ctxHit && ctxHit.confidence >= 0.7 && ctxHit.value?.length)
            ? { ...v, value: ctxHit.value, valueLong: ctxHit.valueLong, prefillSource: "context" }
            : v;
        }));
      }

      // ─── Final pass: pre-fill question answers ──────────────────────
      processedQuestions = fillQuestions(
        processedQuestions,
        finalVariables,
        imageMeta?.tags || {}
      );

      console.timeEnd("totalProcessingTime");
      return new Response(
        JSON.stringify({
          questions: processedQuestions,
          variables: finalVariables,
          masterCommand: parsed.masterCommand || '',
          enhancedPrompt: parsed.enhancedPrompt || '',
          debug: {
            hasImageData: !!imageData?.[0]?.base64,
            model,
            ambiguity: {
              score: ambiguityLevel,
              source: 'LLM determined',
              wordCount: promptText.split(/\s+/).length
            },
            variablesCount: finalVariables.length,
            variableDistribution
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (aiError) {
      console.error('Error with AI analysis:', aiError);
      throw new Error(`AI analysis failed: ${aiError.message}`);
    }

  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    console.timeEnd("totalProcessingTime");
    return new Response(
      JSON.stringify({ 
        error: error.message,
        questions: [],
        variables: [],
        masterCommand: "",
        enhancedPrompt: ""
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
