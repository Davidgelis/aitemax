
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSystemPrompt } from "./system-prompt.ts";
import { analyzePromptWithAI } from "./openai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      promptText, 
      template, 
      websiteData, 
      imageData, 
      smartContextData, 
      model = 'gpt-4.1'
    } = await req.json();

    const wordCount = promptText.split(/\s+/).length;
    const ambiguity = Math.max(0, 1 - Math.min(wordCount/20, 1));

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
      
      // Handle potential markdown formatting in the response
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

      // Track question categories and identify missing pillars
      const categoryCounts = questions.reduce((acc, q) => ({
        ...acc,
        [q.category]: (acc[q.category] || 0) + 1
      }), {} as Record<string, number>);

      const pillarTitles = Array.isArray(template?.pillars) 
        ? template.pillars.map((p: any) => p.title)
        : [];

      const missingPillars = pillarTitles.filter(title => !categoryCounts[title]);

      return new Response(
        JSON.stringify({
          questions,
          variables: parsed.variables || [],
          masterCommand: parsed.masterCommand || '',
          enhancedPrompt: parsed.enhancedPrompt || '',
          debug: {
            hasImageData: !!imageData?.[0]?.base64,
            model,
            ambiguity,
            missingPillars,
            pillarCoverage: {
              total: pillarTitles.length,
              covered: pillarTitles.length - missingPillars.length,
              missing: missingPillars.length
            },
            categories: Object.keys(categoryCounts),
            categoryDistribution: categoryCounts
          }
        }), 
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
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
