
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

//--------------------------------------------------------------------
// MAIN EDGE FUNCTION HANDLER  ←  was accidentally deleted in a merge
//--------------------------------------------------------------------
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Implementation that was previously working
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
    
    // Process the prompt analysis logic here
    // This would include calling OpenAI or other AI services to analyze the prompt
    
    // Generate questions and variables based on the prompt
    const questions = generateQuestions(promptText, template);
    const variables = extractVariables(promptText);
    const masterCommand = generateMasterCommand(promptText);
    const enhancedPrompt = enhancePrompt(promptText, questions, variables);
    
    return new Response(
      JSON.stringify({
        questions,
        variables,
        masterCommand,
        enhancedPrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to analyze prompt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions - these would need to be implemented based on your specific logic
function generateQuestions(prompt, template) {
  // Implementation to generate questions based on the prompt and template
  // This is a placeholder - the actual implementation would depend on your specific requirements
  return [{ 
    id: "q1", 
    question: "What is the primary purpose of this prompt?",
    isRelevant: true,
    answer: "" 
  }];
}

function extractVariables(prompt) {
  // Implementation to extract variables from the prompt
  // This is a placeholder - the actual implementation would depend on your specific requirements
  return [{ 
    id: "v1", 
    name: "Entity", 
    value: "", 
    isRelevant: true 
  }];
}

function generateMasterCommand(prompt) {
  // Implementation to generate a master command
  // This is a placeholder - the actual implementation would depend on your specific requirements
  return "Generated master command based on the prompt";
}

function enhancePrompt(prompt, questions, variables) {
  // Implementation to enhance the prompt based on questions and variables
  // This is a placeholder - the actual implementation would depend on your specific requirements
  return prompt;
}
