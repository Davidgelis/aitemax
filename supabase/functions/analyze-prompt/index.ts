
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
// MAIN EDGE FUNCTION HANDLER
//--------------------------------------------------------------------
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { analyzePromptWithAI, describeImage, describeAndMapImage, inferAndMapFromContext } from "./openai-client.ts";
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
    
    // Generate questions based on the prompt analysis
    let questions: Question[] = [];
    
    if (openAIResult && openAIResult.parsed && Array.isArray(openAIResult.parsed.questions)) {
      // Map OpenAI results to our Question structure
      questions = openAIResult.parsed.questions.map((q: any, index: number) => ({
        id: `q-${index + 1}`,
        text: q.text || q.question || "", // Handle both formats
        answer: "",
        isRelevant: true,
        examples: q.examples || [],
        category: q.category || "General"
      }));
    } else {
      // Fallback to our own question generation if OpenAI fails
      const userIntent = "improve prompt";
      questions = generateContextQuestionsForPrompt(promptText, template, smartContextData, imageAnalysis, userIntent);
    }
    
    // Organize questions by pillars and ambiguity
    questions = organizeQuestionsByPillar(questions, ambiguityLevel);
    
    // Generate or extract variables
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
    
    // If we have images, try to pre-fill variables from image analysis
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
