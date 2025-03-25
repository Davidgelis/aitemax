
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAI } from "https://esm.sh/openai@4.26.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      originalPrompt, 
      answeredQuestions, 
      relevantVariables,
      primaryToggle,
      secondaryToggle,
      userId,
      promptId,
      template // New parameter for template information
    } = await req.json();
    
    console.log(`Enhancing prompt with focus on ${primaryToggle || "no specific toggle"}`);
    console.log(`Original prompt: "${originalPrompt.substring(0, 100)}..."`);
    console.log(`Using template: ${template?.title || "default framework"}`);
    
    // The comprehensive framework for prompt engineering
    let systemMessage = `You are an expert prompt engineer that transforms input prompts into highly effective, well-structured prompts following the four-pillar framework.

TASK: You will be provided with an intent and context information, which may be as brief as two sentences or as extensive as a comprehensive brief. Your job is to enhance this prompt by applying best practices and instructions. Improve clarity, grammar, structure, and logical flow while preserving the original intent.

PERSONA: Assume the role of an advanced scenario generator with expertise in language, prompt engineering, and multi-perspective analysis. You will simulate multiple well-established personas, each analyzing the same strategic question within a professional corporate setting. These include:
- CFO: Focused on cost management and risk mitigation.
- CTO: Prioritizing innovation and technical feasibility.
- CMO: Concentrating on brand perception and market impact.
- HR Lead: Responsible for talent development and organizational culture.

For each persona:
- Present their viewpoints in distinct, clearly labeled sections.
- Use third-person pronouns, minimal contractions, and maintain an executive tone that adheres to a formal brand style.
- Encourage dynamic interplay--each persona should address and build upon the concerns and suggestions of others.
- Conclude with a concise, holistic summary that highlights consensus and notes any open issues.

CONDITIONS:
- Structure-Oriented: Focus on a clear overall layout and logical sequence of information.
- Syntax-Focused: Utilize specific formats or templates to shape the response.
- Categorical Approach: Organize components logically, ensuring clarity and coherence.
- Cross-Checking with Multiple Data Points: Validate outputs against multiple sources.
- Context Awareness & Contradictions: Analyze full meaning rather than just keywords.
- Recognize Pattern-Based Biases: Prevent biases from oversimplified rules.
- Highlight Incomplete Information: Identify missing context with labeled placeholders.
- Define ambiguous terms to avoid misinterpretation.
- Append a "Notes" section for additional clarifications if needed.

INSTRUCTIONS:
1. Outline your approach for analyzing and enhancing the prompt
2. Analyze the input to identify key components and areas for improvement
3. Synthesize and organize into a coherent, revised prompt structure
4. Ensure the final output follows the four pillars: Task, Persona, Conditions, and Instructions
5. Make the prompt complete and standalone, capable of generating high-quality responses
6. Include placeholders for missing context if needed
7. Maintain a natural, flowing style while incorporating all essential elements

OUTPUT FORMAT:
Your enhanced prompt must flow naturally while incorporating all necessary elements. Structure it with clear sections for Task, Persona, Conditions, and Instructions.`;

    // If a template is provided, use its system prefix and pillar structure
    if (template) {
      if (template.systemPrefix) {
        systemMessage = template.systemPrefix;
      }
      
      if (template.pillars && template.pillars.length > 0) {
        // Add the pillar structure to the system message
        systemMessage += '\n\nSTRUCTURE YOUR RESPONSE WITH THESE SECTIONS:';
        template.pillars.forEach(pillar => {
          systemMessage += `\n- ${pillar.name}: ${pillar.content}`;
        });
      }
    }
    
    // Add toggles if specified
    if (primaryToggle) {
      systemMessage += `\n\nPRIMARY FOCUS: ${primaryToggle}`;
    }
    
    if (secondaryToggle) {
      systemMessage += `\nSECONDARY FOCUS: ${secondaryToggle}`;
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openAIApiKey
    });

    // Prepare context from answered questions
    const context = answeredQuestions
      .filter(q => q.answer && q.answer.trim() !== "")
      .map(q => `${q.text}\nAnswer: ${q.answer}`).join("\n\n");

    // Create the prompt for GPT
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `Transform this prompt into an enhanced version following our ${template?.title || 'four-pillar'} framework:

ORIGINAL PROMPT:
${originalPrompt}

CONTEXT FROM USER:
${context}

Create an enhanced prompt that clearly defines the ${template?.pillars.map(p => p.name).join(', ') || 'Task, Persona, Conditions, and Instructions'} while maintaining natural flow and clarity. Focus especially on creating a prompt that can be immediately used in another AI platform with excellent results.` }
    ];

    try {
      // Make the API call
      const completion = await openai.chat.completions.create({
        model: "o3-mini",
        messages: messages,
        temperature: template?.temperature || 0.7,
        max_tokens: template?.maxChars || undefined
      });

      const enhancedPrompt = completion.choices[0].message.content;
      
      return new Response(JSON.stringify({ 
        enhancedPrompt,
        loadingMessage: `Enhancing prompt${primaryToggle ? ` for ${primaryToggle}` : ''}...`,
        usage: completion.usage || { prompt_tokens: 0, completion_tokens: 0 }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openaiError) {
      console.error("Error calling OpenAI API:", openaiError);
      
      // Return a structured error response
      return new Response(JSON.stringify({
        error: openaiError.message,
        enhancedPrompt: `# Error Enhancing Prompt

We encountered an error while trying to enhance your prompt. Please try again.

Original Prompt:
${originalPrompt}`,
        loadingMessage: "Error enhancing prompt..."
      }), {
        status: 200, // Keep 200 to avoid edge function errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Error in enhance-prompt function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      enhancedPrompt: "Error: Could not process the prompt enhancement request.",
      loadingMessage: "Error processing request..." 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
