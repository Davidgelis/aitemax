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

// The duplicate pillarSuggestions function has been removed as requested

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
    // capture both caption AND tags
    let imageAnalysis: { caption: string; tags: Record<string,string> } | null = null;
    
    if (imageData && Array.isArray(imageData) && imageData.length > 0) {
      try {
        const firstImageWithBase64 = imageData.find(img => img.base64);
        
        if (firstImageWithBase64) {
          // get full vision result
          const vision = await describeImage(firstImageWithBase64.base64);
          imageCaption = vision.caption || "";
          imageAnalysis = vision;
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
                  // carry the rich, multi-sentence text into valueLong
                  valueLong: match.valueLong ?? match.value,
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
      const names = blanks.map(v => v.name);
      // include imageCaption as part of the context
      const bigCtx = [
        promptText,
        smartContextData?.context || "",
        websiteData?.pageText || "",
        imageCaption || ""
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

    // ——————————————————————————————————————————————————————————————————————
    // Only keep prefilled values for variables requested by the smart-button
    if (smartContextData?.context?.trim()) {
      const ctx = smartContextData.context.toLowerCase();
      variables = variables.map(v => {
        const name = v.name.toLowerCase();
        const category = (v.category || "").toLowerCase();
        // if the user's smart context mentions this variable name or its category, keep it
        if (ctx.includes(name) || ctx.includes(category)) {
          return v;
        }
        // otherwise clear any prefill
        return { ...v, value: "" };
      });
    }
    // ——————————————————————————————————————————————————————————————————————

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
    questions = fillQuestions(questions, variables);

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
