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
  const baseAmbiguity = Math.max(0, 1 - Math.min(wordCount/20, 1));
  
  // Additional factors that might indicate ambiguity
  const hasSpecificDetails = /(\d+|specific|exact|precise)/i.test(promptText);
  const hasClearObjective = /(need|want|create|make|build|design)/i.test(promptText);
  
  // Adjust ambiguity based on additional factors
  let adjustedAmbiguity = baseAmbiguity;
  if (hasSpecificDetails) adjustedAmbiguity *= 0.8; // Reduce ambiguity if specific details present
  if (!hasClearObjective) adjustedAmbiguity *= 1.2; // Increase ambiguity if no clear objective
  
  // Ensure ambiguity stays between 0 and 1
  return Math.max(0, Math.min(adjustedAmbiguity, 1));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { promptText, template, websiteData, imageData, smartContextData, model = 'gpt-4.1' } = await req.json();

    const ambiguity = calculateAmbiguity(promptText);
    console.log(`Calculated ambiguity: ${ambiguity} for prompt of ${promptText.split(/\s+/).length} words`);

    const systemPrompt = createSystemPrompt(template, ambiguity);
    
    try {
      const { content } = await analyzePromptWithAI(
        promptText,
        systemPrompt,
        model,
        smartContextData?.context || '',
        imageData?.[0]?.base64
      );
      
      let parsed;
      let processedContent = content;
      if (content.includes('```json')) {
        processedContent = content.replace(/```json\n|\n```|```/g, '').trim();
      }
      
      try {
        parsed = JSON.parse(processedContent);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Content that failed to parse:', processedContent);
        throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
      }

      const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
      
      // Enhanced variable processing
      let variables = Array.isArray(parsed.variables) ? parsed.variables : [];
      console.log(`Raw variables received: ${variables.length}`);

      // 1. Truncate names to 3 words
      variables = variables.map(v => ({
        ...v,
        name: v.name.trim().split(/\s+/).slice(0, 3).join(' ')
      }));

      // 2. Filter out overlapping question content
      const qTexts = questions.map(q => q.text.toLowerCase());
      variables = variables.filter(v =>
        v.name &&
        !qTexts.some(qt => qt.includes(v.name.toLowerCase()))
      );

      // 3. Enforce count limit of 8
      if (variables.length > 8) {
        console.log(`Trimming variables from ${variables.length} to 8`);
        variables = variables.slice(0, 8);
      }

      // 4. Build distribution for debugging
      const variableDistribution = variables.reduce<Record<string, number>>((acc, v) => {
        const cat = v.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      console.log(`Final variables count: ${variables.length}`);
      console.log('Variable distribution:', JSON.stringify(variableDistribution));

      return new Response(
        JSON.stringify({
          questions,
          variables,
          masterCommand: parsed.masterCommand || '',
          enhancedPrompt: parsed.enhancedPrompt || '',
          debug: {
            hasImageData: !!imageData?.[0]?.base64,
            model,
            ambiguity: {
              score: ambiguity,
              wordCount: promptText.split(/\s+/).length
            },
            variablesCount: variables.length,
            variableDistribution
          }
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (aiError) {
      console.error('Error with AI analysis:', aiError);
      throw new Error(`AI analysis failed: ${aiError.message}`);
    }

  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
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
