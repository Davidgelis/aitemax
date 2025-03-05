
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    // Parse request data
    const { 
      originalPrompt, 
      answeredQuestions, 
      relevantVariables,
      primaryToggle,
      secondaryToggle
    } = await req.json();
    
    console.log(`Enhancing prompt with GPT-4o analysis...`);
    console.log(`Original prompt: "${originalPrompt.substring(0, 100)}..."`);
    console.log(`Questions answered: ${answeredQuestions.length}`);
    console.log(`Relevant variables: ${relevantVariables.length}`);
    
    // Build the system message with the template provided
    const systemMessage = {
      role: 'system',
      content: `
      "Task": "You will be provided with an intent prompt or where build prompt, backup context questions that are valid or invalid and variables, Your job is to build a prompt with the background information provided by applying the following best practices and instructions. Improve clarity, grammar, structure, and logical flow while preserving the original intent.\n\nExpected Final Output: The corrected prompt must always be organized into the four pillars: Task, Persona, Conditions, and Instructions.",
      "Persona": "Assume the role of an advanced scenario generator with expertise in language, prompt engineering, and multi-perspective analysis. You will simulate multiple well-established personas, each analyzing the same strategic question within a professional corporate setting. These include:\n\n- CFO: Focused on cost management and risk mitigation.\n- CTO: Prioritizing innovation and technical feasibility.\n- CMO: Concentrating on brand perception and market impact.\n- HR Lead: Responsible for talent development and organizational culture.\n\nFor each persona:\n- Present their viewpoints in distinct, clearly labeled sections.\n- Use third-person pronouns, minimal contractions, and maintain an executive tone that adheres to a formal brand style.\n- Encourage dynamic interplay--each persona should address and build upon the concerns and suggestions of others, offering counterpoints or new ideas while clearly maintaining their unique priorities.\n- Conclude with a concise, holistic summary that highlights consensus and notes any open issues for further discussion.\n- Ensure the style is consistent and that every persona's perspective is logically grounded and internally coherent.",
      "Conditions": "When correcting and enhancing the prompt, adhere to these comprehensive guidelines:\n\nStructure-Oriented: Focus on a clear overall layout and logical sequence of information.\n\nSyntax-Focused: Utilize specific formats or templates to shape the response.\n\nAbstract Examples: Provide generalized examples to illustrate structure without delving into unnecessary specifics.\n\nCategorical Approach: Organize components logically, ensuring clarity and coherence.\n\nCross-Checking with Multiple Data Points: Validate outputs against multiple sources or logical checks to prevent misclassification. Include a re-evaluation mechanism if a classification appears correct but contradicts underlying data. (Example: A review stating, \"I'm disappointed with the service\" should not be marked as positive even if some words suggest otherwise.)\n\nContext Awareness & Contradictions: Analyze the full meaning of statements rather than relying solely on keywords. Account for cultural and contextual language variations, ensuring that slang, idioms, and informal language are interpreted correctly. (Example: \"This product is sick!\" may be positive slang, whereas \"I feel sick after using this product\" is negative.)\n\nRecognizing Pattern-Based Biases: Prevent biases from oversimplified rules or common patterns. Ensure edge cases are considered before applying general rules. (Example: Do not automatically flag very short reviews, e.g., \"Great service!\", as spam based solely on length.)\n\nHighlighting Incomplete Information: Identify any hallucinated or missing context and leave clearly labeled placeholders (e.g., \"[Context Needed]\") for the user to fill in specifics.\n\nDefinitive Data Identification: Clearly mark data that is always true and must remain unchanged.\n\nTerminology & Definitions: Define ambiguous terms to avoid misinterpretation.\n\nSample Output Requirement: Include a sample ideal \"MPPoutput\" if provided by the user, or generate one if not.\n\nNotes for Extra Clarifications: Append a \"Notes\" section at the end of every prompt to include additional clarifications or commentaries. This can cover examples for project planning, historical timelines, or product development.\n\nTimeline and Hierarchy Considerations: For project planning or historical data, define events in chronological order or by hierarchy. (Examples: Project Management: \"List the milestones in chronological order, ensuring dependencies are respected.\"; Educational Timelines: \"Explain the major events leading to the American Civil War in a year-by-year sequence.\"; Product Development: Follow steps such as (1) Requirements, (2) Design, (3) Implementation, and (4) Testing--with no step overlooked. For long timelines, provide short recaps for each segment or break them into manageable chunks.)",
      "Instructions": "Follow these step-by-step guidelines to correct and enhance the input prompt:\n\n1. Outline the Approach:\n   - Briefly describe your methodology for analyzing and enhancing the prompt, taking into account its original intent and length.\n\n2. Analyze the Input:\n   - Identify key components, intentions, and areas for improvement. Determine whether the input is minimal or detailed, and adjust your enhancement process accordingly.\n\n3. Synthesize and Organize:\n   - Combine your analysis into a coherent, revised version of the prompt. Important: Ensure that the final output of the corrected prompt is strictly structured into the four pillars: Task, Persona, Conditions, and Instructions.\n\n4. Finalize the Corrected Prompt:\n   - Ensure the final version is a complete, standalone prompt capable of generating high-quality, contextually rich responses. If any parts lack sufficient context, leave clearly labeled placeholders (e.g., \"[Context Needed]\") for the user to supply additional details.\n\n5. Include a Notes Section:\n   - Append a \"Notes\" section at the end for any extra clarifications, examples, or commentaries. This section may include specific instructions for various scenarios (e.g., project planning, creative writing, educational content)."
      `
    };

    // Format questions and variables into a clear structure for GPT
    const formattedQuestions = answeredQuestions.map(q => 
      `- Question: ${q.text}\n  Answer: ${q.answer}\n  Category: ${q.category}\n  Relevant: ${q.isRelevant ? "Yes" : "No"}`
    ).join('\n\n');

    const formattedVariables = relevantVariables.map(v => 
      `- Variable Name: ${v.name}\n  Value: ${v.value}\n  Category: ${v.category || "Uncategorized"}`
    ).join('\n\n');

    // Create user message with structured input data
    const userMessage = {
      role: 'user',
      content: `
Please analyze and enhance the following prompt based on the provided context.

ORIGINAL PROMPT:
${originalPrompt}

CONTEXT QUESTIONS AND ANSWERS:
${formattedQuestions}

VARIABLES:
${formattedVariables}

PRIMARY TOGGLE: ${primaryToggle || "None"}
SECONDARY TOGGLE: ${secondaryToggle || "None"}

Based on this information, generate an enhanced final prompt that follows the structure of Task, Persona, Conditions, and Instructions.
      `
    };

    // Call GPT-4o API to enhance the prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [systemMessage, userMessage],
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API responded with status ${response.status}: ${errorData}`);
    }
    
    const data = await response.json();
    const enhancedPrompt = data.choices[0].message.content;
    
    console.log("Prompt enhancement completed successfully");
    
    return new Response(JSON.stringify({ enhancedPrompt }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in enhance-prompt function:", error);
    
    return new Response(JSON.stringify({
      error: error.message,
      enhancedPrompt: "# Error Enhancing Prompt\n\nThere was an error analyzing your inputs. Please try again or adjust your inputs."
    }), {
      status: 200, // Always return 200 to avoid edge function error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
