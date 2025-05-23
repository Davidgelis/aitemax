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
import { extractMeaningfulElements } from "./utils.ts";  // Added import for the missing function

// ─── Helpers you removed ─────────────────────────────────────────
const MAX_EXAMPLES = 4;
const MAX_VAR_LEN   = 100;   // concise variable (≈ 10-15 words)
const MAX_QA_LEN    = 1000;  // in-depth answer limit

/** Normalize question text, strip trailing "(…)" */
const plainify = (t = "") =>
  t
    .replace(/resolution|dpi|rgb|hex/gi, "colour")
    .replace(/\bn\s+image\b/gi, "an image")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();

/** Ensure we only keep up to MAX_EXAMPLES in .examples */
const ensureExamples = (q: any) => ({
  ...q,
  examples: Array.isArray(q.examples)
    ? q.examples.slice(0, MAX_EXAMPLES)
    : []
});

/** Dedupe and cap variables to 8, clamp long values */
const processVariables = (vars: any[]): any[] => {
  const STOP = new Set(["of","the","a","an"]);
  const canonical = (l: string) =>
    l.toLowerCase().split(/\s+/).filter(w => !STOP.has(w)).sort().join(" ");
  let v = vars.map((x: any) => {
    const raw = (x.valueLong || x.value || "").trim();
    let short = raw.length > 100
      ? raw.slice(0, 100).replace(/\s+\S*$/, "") + "…"
      : raw;
    return { ...x, value: short };
  });
  const seen = new Set<string>();
  return v.filter(x => {
    const sig = canonical(x.name);
    if (!sig || seen.has(sig)) return false;
    seen.add(sig);
    return true;
  }).slice(0, 8);
};

/** Auto-answer questions from image/variable tags */
const fillQuestions = (qs: any[], vars: any[]): any[] => {
  const tagTest: Record<string, RegExp> = {
    palette:   /(palette|colour|color)/i,
    style:     /(style|aesthetic|genre|art\s*style)/i,
    mood:      /(mood|tone|feeling|emotion)/i,
    background:/(background|setting|environment|scene)/i,
    subject:   /(subject|object|figure|person)/i
  };
  return qs.map(q => {
    if (q.answer) return q;
    for (const [tag, re] of Object.entries(tagTest)) {
      if (!re.test(q.text)) continue;
      const iv = vars.find(v => v.prefillSource === 'image' && (v.category||"").toLowerCase() === tag);
      if (iv && iv.valueLong) return { ...q, answer: iv.valueLong.trim(), prefillSource: 'image' };
    }
    const hit = vars.find(v => v.valueLong && q.text.toLowerCase().includes(v.name.toLowerCase()));
    if (hit) return { ...q, answer: hit.valueLong, prefillSource: hit.prefillSource };
    return q;
  });
};

//--------------------------------------------------------------------
//  ✨ concise "user-intent" extractor (from previous patch)
//--------------------------------------------------------------------
const extractUserIntent = (txt = ""): string => {
  if (txt.length < 60) return txt.trim();
  const firstSentence = txt.split(/[.!?]/).find(s => s.trim().length > 20);
  if (firstSentence) return firstSentence.trim();
  return txt.split(/\s+/).slice(0, 12).join(" ").trim();
};

//--------------------------------------------------------------------
// MAIN EDGE FUNCTION HANDLER
//--------------------------------------------------------------------
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // read the incoming body in one go:
    const body = await req.json();

    // ─── DEBUG: Incoming template from client ───
    console.log(`🏷️ [analyze-prompt] got template.id=${body.template?.id}, pillars=[${body.template?.pillars?.map((p: any)=>p.id).join(",")}]`);

    // log out exactly what we care about — template.pillars:
    console.log("🛠️  analyze-prompt got template.pillars:", JSON.stringify(body.template?.pillars, null, 2));
    // (if you want the entire payload, uncomment the next line)
    // console.log("🛠️  analyze-prompt full payload:", JSON.stringify(body, null, 2));

    // now destructure from that same body:
    const {
      promptText,
      userId,
      promptId,
      template,
      model,
      imageData,
      websiteData,
      smartContextData
    } = body;
    
    if (!promptText || typeof promptText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid promptText parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Analyzing prompt with model: ${model || 'default'}`);
    
    const ambiguityLevel = computeAmbiguity(promptText);
    
    let imageCaption = "";
    // capture both caption AND tags
    let imageAnalysis: { caption: string; tags: Record<string,string> } | null = null;
    
    // Prepare concurrent AI calls for image captioning and prompt analysis
    const firstImageWithBase64 = imageData && Array.isArray(imageData)
      ? imageData.find(img => img.base64)
      : null;

    // Launch image analysis in parallel (with 30s timeout)
    const describeImagePromise = firstImageWithBase64
      ? Promise.race([
          describeImage(firstImageWithBase64.base64),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Image analysis timed out")), 30000)
          )
        ]).catch(err => {
          console.error("Error processing image data:", err);
          return null;
        })
      : Promise.resolve(null);
    
    // 1) Incorporate usageInstructions into the system prompt (no image caption to speed up parallel calls)
    const firstImage = imageData && Array.isArray(imageData) && imageData.length > 0 ? imageData[0] : null;
    
    // Ensure usageInstructions is a string before trimming; fall back to image context if none provided
    let usageInstr = "";
    if (smartContextData && typeof smartContextData.usageInstructions === "string") {
      usageInstr = smartContextData.usageInstructions.trim();
    }
    if (!usageInstr && firstImage?.context) {
      usageInstr = firstImage.context.trim();
    }
    
    const systemPrompt = [
      createSystemPrompt(template, ""),  // omit imageCaption here to avoid waiting
      usageInstr ? `\n\nUsage Instructions:\n${usageInstr}` : ""
    ].join("\n");
    
    // 2) Launch prompt analysis in parallel with image description
    // Combine any provided user context or website text for analysis (validate types)
    const userContextText = (smartContextData && typeof smartContextData.context === "string")
      ? smartContextData.context.trim()
      : "";
    const pageText = (websiteData && typeof websiteData.pageText === "string")
      ? websiteData.pageText
      : "";
    const additionalContext = [ userContextText, pageText ].filter(Boolean).join("\n\n");
    
    const analyzePromptPromise = analyzePromptWithAI(
      promptText,
      systemPrompt,
      model || 'gpt-4.1',
      additionalContext,
      null
    ).catch(err => {
      console.error("OpenAI analysis error:", err);
      return null;
    });
    const [openAIResult, vision] = await Promise.all([analyzePromptPromise, describeImagePromise]);
    if (vision) {
      imageCaption = vision.caption || "";
      imageAnalysis = vision;
      console.log("Image caption generated (post-analysis)");
    }
    
    //---------------------------------------------------------------
    //  NEW QUESTION & VARIABLE GENERATION (step 1–3)
    //---------------------------------------------------------------

    // 1️⃣ Extract the user's main intent from their prompt
    const userIntent = extractUserIntent(promptText);
    
    // ─── 1.  Extract meaningful elements early ───
    const extracted = extractMeaningfulElements(promptText);
    // pick the first noun-phrase subject, strip stop-words like "image of"
    const primarySubject = extracted?.subjects?.[0]?.text
      ?.replace(/^image of (a|an|the)\s+/i, "")
      ?.trim()
      || "";

    // 2️⃣ Generate all questions via your contextual generator
    let questions: Question[] = generateContextQuestionsForPrompt(
      promptText,
      template,
      smartContextData,
      imageAnalysis,
      userIntent,
      primarySubject      // 🆕  inject for subject-aware questions
    ).map((q: any, i: number) => ({
      id:         q.id    || `q-${i+1}`,
      text:       q.text,
      answer:     "",
      isRelevant: true,
      examples:   Array.isArray(q.examples) ? q.examples.slice(0, MAX_EXAMPLES) : [],
      category:   q.category || (template?.pillars?.[i]?.title as string) || "General"
    }));

    // 🔄 LLM-based fallback: add questions for pillars that had none in static suggestions
    if (openAIResult?.parsed?.questions && Array.isArray(openAIResult.parsed.questions)) {
      const existingCats = new Set(questions.map(q => q.category.toLowerCase()));
      for (const pillar of (template?.pillars || [])) {
        const pillarTitle: string = (pillar.title || "").toLowerCase();
        if (!existingCats.has(pillarTitle)) {
          // Use LLM-suggested questions for this missing pillar (if any)
          const pillarQuestions = openAIResult.parsed.questions.filter(
            (qq: any) => qq.category && qq.category.toLowerCase() === pillarTitle
          );
          pillarQuestions.forEach((qq: any) => {
            questions.push({
              id:        qq.id || `q-${questions.length + 1}`,
              text:      qq.text,
              answer:    qq.answer || "",
              isRelevant: typeof qq.isRelevant === 'boolean' ? qq.isRelevant : true,
              examples:  Array.isArray(qq.examples) ? qq.examples.slice(0, MAX_EXAMPLES) : [],
              category:  pillar.title || qq.category || "General"
            });
          });
        }
      }
    }

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
    
    // ---------- Parallel image & context variable filling ----------
    const firstImageBase64 = imageData && Array.isArray(imageData)
      ? imageData.find(img => img.base64)?.base64
      : null;
    // Prepare context for blank variables (prompt + user/site context + image caption)
    const blanks = variables.filter(v => !v.value);
    const blankNames = blanks.map(v => v.name);
    const bigCtx = [
      promptText,
      smartContextData?.context || "",
      websiteData?.pageText || "",
      imageCaption || ""
    ].join("\n\n").trim();

    const [imageMapping, contextMapping] = await Promise.all([
      firstImageBase64 && variables.length
        ? describeAndMapImage(firstImageBase64, variables.map(v => v.name))
        : Promise.resolve(null),
      blankNames.length
        ? inferAndMapFromContext(bigCtx, blankNames)
        : Promise.resolve(null)
    ]);

    // Merge image-based and context-based prefills
    if (imageMapping && imageMapping.fill) {
      // Apply image analysis results (style/palette/mood) to variables
      variables = variables.map(v => {
        const cat = (v.category || "").toLowerCase();
        const imgHit = Object.entries(imageMapping.fill).find(([k]) => canonKey(k) === canonKey(v.name))?.[1];
        if (imgHit && /(style|colour|color|palette|mood|aesthetic)/.test(cat) && imgHit.value) {
          // Prefill style/palette/mood variable from image
          v = {
            ...v,
            value: imgHit.value,
            valueLong: imgHit.valueLong ?? imgHit.value,
            prefillSource: "image"
          };
          console.log(`🖼️ image prefill: [${v.name}] = "${imgHit.value}"`);
        }
        // (Continue to context merge below)
        return v;
      });
    }
    if (contextMapping && contextMapping.fill) {
      const useWebsiteLabel = !smartContextData?.context && websiteData?.pageText;
      variables = variables.map(v => {
        const ctxHit = Object.entries(contextMapping.fill).find(([k]) => canonKey(k) === canonKey(v.name))?.[1];
        if (ctxHit && ctxHit.value) {
          const existingSource = v.prefillSource;
          if (!(existingSource === 'image' && smartContextData?.context && ctxHit.valueLong)) {
            // ▸ KEEP variable values concise
            const shortVal = (ctxHit.value + "").slice(0, MAX_VAR_LEN).trim();
            v = {
              ...v,
              value: shortVal,
              valueLong: (ctxHit.valueLong || ctxHit.value).slice(0, MAX_VAR_LEN).trim(),
              prefillSource: useWebsiteLabel ? "website" : "context"
            };
            const srcLabel = useWebsiteLabel ? '🌐' : '📖';
            console.log(`${srcLabel} prefill: [${v.name}] = "${ctxHit.valueLong || ctxHit.value}"`);
          } else {
            console.log(`⚠️  context suggested a value for "${v.name}", but image prefill retained`);
          }
        }
        return v;
      });
    }

    // ----------- 7. 𝗙𝗶𝗻𝗮𝗹 anti-hallucination pass -----------
    // Build a corpus containing every user-supplied text source
    const contextCorpus = [
      promptText,
      smartContextData?.context || "",
      websiteData?.pageText   || "",
      imageCaption            || ""      // caption comes from image → real evidence
    ].join(" ").toLowerCase();

    variables = variables.map(v => {
      // Only care about values supplied by the LLM itself (no prefillSource tag)
      if (!v.prefillSource && v.value) {
        const valueLc = (v.value + "").toLowerCase();
        // If the value text never occurs in any user context, wipe it
        if (!contextCorpus.includes(valueLc)) {
          return { ...v, value: "" };   // leave variable in list but blank
        }
      }
      return v;
    });

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

    // Relaxed smart-context filtering: keep all prefilled variable values by default.
    if (smartContextData?.context?.trim() || usageInstr) {
      variables = variables.map(v => {
        // Do not clear any variable's value unless user explicitly overrides it.
        return v;
      });
    }

    // ─── Auto-answer questions from variables & image tags ──────────
    // use the tags we already fetched up front
    const imgTags = imageAnalysis?.tags || {};
    
    // ─── IMAGE-ANALYSIS "style" PRE-FILL via smartContextData.context ───
    if (
      imageData && Array.isArray(imageData) && imageData.length > 0 &&
      smartContextData?.context?.trim().length
    ) {
      const styleQRe = /(style|visual aesthetic|palette|colour|color|mood|era|genre)/i;
      const pendingStyleQs = questions.filter(q => !q.answer && styleQRe.test(q.text));
      if (pendingStyleQs.length) {
        const keys = pendingStyleQs.map(q => q.text);
        const ctxForStyle = smartContextData.context;
        console.log(`🖼️  style-pre-fill: running on ${keys.length} questions`);
        try {
          const styleMap = await inferAndMapFromContext(ctxForStyle, keys);
          if (styleMap?.fill) {
            questions = questions.map(q => {
              if (!q.answer && styleQRe.test(q.text)) {
                const slot = styleMap.fill[q.text];
                if (slot?.valueLong) {
                  const val = slot.valueLong.length > 1000
                    ? slot.valueLong.slice(0,1000)
                    : slot.valueLong;
                  console.log(`   ↳ rich pre-fill "${q.text}" → …${val.slice(0,30)}`);
                  return {
                    ...q,
                    answer: val,
                    prefillSource: "style-analysis"
                  };
                } else if (slot?.value) {
                  return {
                    ...q,
                    answer: slot.value,
                    prefillSource: "style-analysis"
                  };
                }
              }
              return q;
            });
            console.log("✅ style-pre-fill applied");
          }
        } catch (err) {
          console.error("❌ style-pre-fill error:", err);
        }
      }
    }
    
    // 2️⃣ Context/Website-based question pre-fill
    if (smartContextData?.context?.trim() || usageInstr || pageText) {
      // Auto-answer questions relevant to the user's context or provided website content
      const contextSynonyms: Record<string, RegExp> = {
        palette: /(palette|colour|color|colors|scheme)/i,
        style: /(style|aesthetic|genre|art\s*style|design|look)/i,
        mood: /(mood|tone|feeling|emotion|atmosphere|vibe)/i,
        background: /(background|setting|environment|scene)/i,
        subject: /(subject|object|figure|person|topic|content)/i,
        lighting: /(lighting|illumination|light)/i,
        composition: /(composition|arrangement|framing|layout)/i
      };
      const focusText = [ userContextText, usageInstr, pageText ].filter(Boolean).join(" ").toLowerCase();
      const focusWords = focusText.split(/\W+/).filter(Boolean);
      const pendingQs = questions.filter(q => {
        if (q.answer) return false;
        const qText = q.text.toLowerCase();
        const qWords = qText.split(/\W+/).filter(Boolean);
        const category = (q.category || "").toLowerCase();
        return (
          (category && contextSynonyms[category] && contextSynonyms[category].test(focusText)) ||
          (category && focusText.includes(category)) ||
          focusWords.some(word => qText.includes(word)) ||
          qWords.some(word => focusText.includes(word))
        );
      }).map(q => q.text);
      const contextContent = [ userContextText, usageInstr, pageText ].filter(Boolean).join("\n\n");
      if (pendingQs.length) {
        const sourceLabel = userContextText ? 'context' : 'website';
        console.log(`${userContextText ? '📖' : '🌐'} ${sourceLabel}-pre-fill: running on ${pendingQs.length} questions`);
        const ctxMap = await inferAndMapFromContext(contextContent, pendingQs).catch(() => null);
        if (ctxMap?.fill) {
          questions = questions.map(q => {
            if (!q.answer) {
              const fillAns = ctxMap.fill[q.text];
              if (fillAns?.valueLong) {
                const val = fillAns.valueLong.length > MAX_QA_LEN ? fillAns.valueLong.slice(0, MAX_QA_LEN) : fillAns.valueLong;
                console.log(`   ↳ ${userContextText ? '📖' : '🌐'} rich pre-fill "${q.text}" → …${val.slice(0,30)}`);
                return { ...q, answer: val, prefillSource: userContextText ? 'context' : 'website' };
              } else if (fillAns?.value) {
                const shortAns = fillAns.value.length > MAX_QA_LEN ? fillAns.value.slice(0, MAX_QA_LEN) : fillAns.value;
                console.log(`   ↳ ${userContextText ? '📖' : '🌐'} pre-fill "${q.text}" → "${shortAns.length > 30 ? shortAns.slice(0, 30) + '...' : shortAns}"`);
                return { ...q, answer: shortAns, prefillSource: userContextText ? 'context' : 'website' };
              }
            }
            return q;
          });
        }
      }
    }

    // then do your existing var/image-based auto-answer
    questions = fillQuestions(questions, variables)
      .map(q => {
        // trim any over-long auto answers
        if (q.answer && q.answer.length > MAX_QA_LEN) {
          // cut at the last space before the limit to avoid breaking a word
          const cut = q.answer.slice(0, MAX_QA_LEN);
          const lastSpace = cut.lastIndexOf(" ");
          q.answer = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();
        }
        const cleanedText = plainify(q.text);
        return ensureExamples({ ...q, text: cleanedText });
      });

    // Determine questions per pillar based on missing variables  
    const varsByCategory: Record<string, typeof variables> = {};
    const questionsPerPillar: Record<string, number> = {};
    
    const pillars: string[] = Array.isArray(template?.pillars)
      ? template.pillars.map((p: any) => p.title)
      : [];
    
    pillars.forEach(pillar => {
      // Default count per pillar based on ambiguity, adjusted if extra context provided
      const baseCount = ambiguityLevel >= 0.6 ? 3 : 2;
      questionsPerPillar[pillar] = (smartContextData?.context?.trim() || websiteData?.pageText?.trim())
        ? Math.max(1, baseCount - 1)  // if user provided additional context, ask one fewer question per pillar (minimum 1)
        : baseCount;
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
    
    // ─── Assemble response, including any warnings from partial failures ───
    const warnings: string[] = [];
    if (!openAIResult) {
      warnings.push("AI analysis could not be completed – using default questions.");
    } else if (openAIResult.parsed && "_INVALID_RESPONSE_" in openAIResult.parsed) {
      warnings.push("AI analysis returned an invalid result and was replaced with default suggestions.");
    }
    if (imageData && Array.isArray(imageData)) {
      // If any image was omitted (too large or removed), add a warning
      if (imageData.some(img => img.base64 === null)) {
        warnings.push("One or more images were too large and were not analyzed.");
      } else if (firstImageWithBase64?.base64 && firstImageWithBase64.base64.length >= 650000) {
        warnings.push("The provided image was very large and was skipped in analysis.");
      }
      // If image format was unsupported by the AI (not png/jpg/gif/webp)
      if (firstImageWithBase64?.base64 && !/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(firstImageWithBase64.base64)) {
        warnings.push("The image format is not supported for AI analysis and was ignored.");
      }
      // If image analysis failed or timed out, add a warning that it was skipped
      if (firstImageWithBase64?.base64 &&
          firstImageWithBase64.base64.length < 650000 &&
          /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(firstImageWithBase64.base64) &&
          vision === null) {
        warnings.push("Image analysis could not be completed – proceeding without image context.");
      }
    }
    const response: any = {
      questions,
      variables,
      masterCommand,
      enhancedPrompt,
      ambiguityLevel
    };
    if (warnings.length) {
      response.warnings = warnings;
    }
    
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
