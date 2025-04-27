
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSystemPrompt } from "./system-prompt.ts";
import { analyzePromptWithAI } from "./openai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

const plainify = (text: string): string =>
  text
    .replace(/resolution|dpi|rgb|hex/gi, 'colour')
    .replace(/\bn\s+image\b/gi, 'an image')
    .trim();

const ensureExamples = (q: any) => {
  if (!Array.isArray(q.examples) || !q.examples.length) return q;
  const ex = q.examples.slice(0, MAX_EXAMPLES).join(', ');
  const withParens = /\(.+\)$/.test(q.text) ? q.text : `${q.text} (${ex})`;
  return { ...q, text: withParens };
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

  // 1️⃣ Trim to max three words
  const trimmedVariables = variables.map(v => ({
    ...v,
    name: v.name.trim().split(/\s+/).slice(0, 3).join(" ")
  }));
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

  // 4️⃣ Drop variables that overlap any question text
  const qText = questions.map(q => q.text.toLowerCase());
  const nonOverlappingVariables = categorizedVariables.filter(v => !qText.some(t => t.includes(v.name.toLowerCase())));
  console.log(`After removing question overlaps: ${nonOverlappingVariables.length} variables`);

  // 5️⃣ Cap at eight
  const finalVariables = nonOverlappingVariables.length > 8 
    ? nonOverlappingVariables.slice(0, 8)
    : nonOverlappingVariables;

  if (nonOverlappingVariables.length > 8) {
    console.log(`Trimming variables from ${nonOverlappingVariables.length} → 8`);
  }

  // Debug distribution
  const variableDistribution = finalVariables.reduce<Record<string, number>>((acc, v) => {
    const cat = v.category || "Other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  console.log(`Final variables: ${finalVariables.length}`, variableDistribution);
  console.timeEnd("variableProcessing");
  
  return { finalVariables, variableDistribution };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.time("totalProcessingTime");
  try {
    const { promptText, template, websiteData, imageData, smartContextData, model = 'gpt-4o' } = await req.json();
    console.log(`Request received for model: ${model}`);
    console.log(`Prompt length: ${promptText.length} characters`);
    console.log(`Prompt text: "${promptText}"`);
    
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

    const ambiguity = calculateAmbiguity(promptText);
    console.log(`Calculated ambiguity: ${ambiguity} for prompt of ${promptText.split(/\s+/).length} words`);

    const systemPrompt = createSystemPrompt(template, ambiguity);
    console.log("System prompt created");
    
    try {
      console.time("aiAnalysisTime");
      const { content } = await analyzePromptWithAI(
        promptText,
        systemPrompt,
        model,
        smartContextData?.context || '',
        imageData?.[0]?.base64
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
    
    // Post-process questions
    // 1. Plain language + example append
    let processedQuestions = questions.map(q => ensureExamples({ ...q, text: plainify(q.text) }));

    // 2. Group by pillar for count enforcement
    const byPillar = processedQuestions.reduce<Record<string, any[]>>((acc, q) => {
      const cat = q.category || 'Other';
      (acc[cat] = acc[cat] || []).push(q);
      return acc;
    }, {});

    // 3. Enforce question count based on ambiguity
    Object.keys(byPillar).forEach(cat => {
      const desired = ambiguity >= 0.6 ? 3 : 2;
      if (byPillar[cat].length > desired) {
        byPillar[cat] = byPillar[cat].slice(0, desired);
      } else if (byPillar[cat].length < 3 && ambiguity >= 0.6) {
        // If we need 3 questions but have fewer, duplicate the last one to reach 3
        // This ensures we always have 3 questions per pillar for high ambiguity
        const lastQuestion = byPillar[cat][byPillar[cat].length - 1];
        while (byPillar[cat].length < 3) {
          // Create a copy with a different ID
          const duplicate = {
            ...lastQuestion,
            id: `${lastQuestion.id || 'q'}-dup-${byPillar[cat].length}`
          };
          byPillar[cat].push(duplicate);
        }
      }
    });

    // 4. Flatten back to array
    processedQuestions = Object.values(byPillar).flat();
    console.log(`Processed questions count: ${processedQuestions.length}`);

    // Process variables as before
    const { finalVariables, variableDistribution } = processVariables(
      Array.isArray(parsed.variables) ? parsed.variables : [], 
      processedQuestions
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
            score: ambiguity,
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
