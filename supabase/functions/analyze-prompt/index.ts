
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

const defaultPrompt = {
  "title": "Prompt Gap Analyzer",
  "description": "This tool examines an input prompt for missing details across four pillars: Task, Persona, Conditions, and Instructions. For each pillar, it generates up to 3 distinct, non-redundant questions to help you provide the necessary information to fully utilize the master prompt.",
  "master_prompt": {
    "Task": "You will be provided with an input prompt, which may be as brief as two sentences or as extensive as a comprehensive brief. Your job is to enhance this prompt by applying the following best practices and instructions. Improve clarity, grammar, structure, and logical flow while preserving the original intent. Expected Final Output: The corrected prompt must always be organized into the four pillars: Task, Persona, Conditions, and Instructions.",
    "Persona": "Assume the role of an advanced scenario generator with expertise in language, prompt engineering, and multi-perspective analysis. You will simulate multiple well-established personas, each analyzing the same strategic question within a professional corporate setting. These include: CFO (focused on cost management and risk mitigation), CTO (prioritizing innovation and technical feasibility), CMO (concentrating on brand perception and market impact), and HR Lead (responsible for talent development and organizational culture). For each persona: present their viewpoints in distinct, clearly labeled sections, use third-person pronouns with minimal contractions, and maintain an executive tone. Encourage dynamic interplay--each persona should address and build upon others' suggestions while retaining their unique priorities. Conclude with a concise summary that highlights consensus and any open issues.",
    "Conditions": "When correcting and enhancing the prompt, adhere to these guidelines: Focus on a clear overall layout and logical sequence; use specific formats or templates; provide abstract examples without unnecessary details; organize components logically for clarity and coherence; validate outputs with multiple checks; ensure cultural and contextual language awareness; prevent biases from oversimplified rules; mark any missing context with '[Context Needed]'; clearly identify definitive data; define ambiguous terms; and include a sample ideal output if available. Also, append a 'Notes' section for extra clarifications.",
    "Instructions": "Follow these step-by-step guidelines: 1. Outline your approach for analyzing and enhancing the prompt based on its original intent and length. 2. Identify key components and areas for improvement, noting whether the input is minimal or detailed. 3. Synthesize your analysis into a coherent, revised prompt organized strictly into the four pillars: Task, Persona, Conditions, and Instructions. 4. Finalize the prompt as a complete, standalone version capable of generating high-quality responses; include placeholders ('[Context Needed]') where context is lacking. 5. Append a 'Notes' section for additional clarifications or examples as needed."
  },
  "analysis_steps": {
    "Task": "Review whether the prompt clearly defines the main objective and expected outcomes. Generate no more than 3 distinct, non-redundant questions such as: 'What is the primary goal of this task?', 'What outcomes should be achieved?', and 'Is there any additional context required for the task?'",
    "Persona": "Check if the required personas (e.g., CFO, CTO, CMO, HR Lead) are clearly defined with their roles and tones. Generate up to 3 unique questions such as: 'Which personas should be included?', 'What specific characteristics should each persona exhibit?', and 'Are there any additional role perspectives needed?'",
    "Conditions": "Examine if the guidelines for structure, syntax, and context are thoroughly specified. Generate up to 3 distinct questions such as: 'What specific formatting or style guidelines should be applied?', 'Are there any validation rules or conditions that must be followed?', and 'Is any additional contextual information needed?'",
    "Instructions": "Determine if clear, step-by-step instructions for enhancing the prompt are provided. Generate up to 3 non-redundant questions such as: 'What detailed steps should be followed to refine the prompt?', 'How should the final output be structured?', and 'Are there any parts of the process that require further clarification?'"
  },
  "output_format": {
    "GapTask": "[List up to 3 gap questions for Task or 'Complete' if no gaps]",
    "GapPersona": "[List up to 3 gap questions for Persona or 'Complete' if no gaps]",
    "GapConditions": "[List up to 3 gap questions for Conditions or 'Complete' if no gaps]",
    "GapInstructions": "[List up to 3 gap questions for Instructions or 'Complete' if no gaps]",
  },
  "notes": "For each pillar, provide no more than 3 distinct, non-overlapping questions that target missing information. Avoid redundant or overlapping queries. This output must be valid JSON following the above structure and should help gather all details necessary to maximize the potential of the master prompt."
};

serve(async (req) => {
  // CORS preflight request handling
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { promptText, primaryToggle, secondaryToggle } = await req.json();
    
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set");
    }

    // Create system message based on toggles
    let systemMessage = "You are an AI assistant specialized in prompt engineering and analysis.";
    
    if (primaryToggle) {
      if (primaryToggle === "complex") {
        systemMessage += " You excel at breaking down complex reasoning tasks into manageable components.";
      } else if (primaryToggle === "math") {
        systemMessage += " You are particularly skilled at mathematical problem-solving and quantitative analysis.";
      } else if (primaryToggle === "coding") {
        systemMessage += " You have expertise in programming and software development concepts.";
      } else if (primaryToggle === "copilot") {
        systemMessage += " You are designed to help create effective AI assistants and copilots.";
      }
    }
    
    if (secondaryToggle) {
      if (secondaryToggle === "token") {
        systemMessage += " You provide concise, token-efficient responses.";
      } else if (secondaryToggle === "strict") {
        systemMessage += " You provide clear, direct, and structured responses without unnecessary embellishment.";
      } else if (secondaryToggle === "creative") {
        systemMessage += " You offer creative and innovative solutions while maintaining clarity.";
      }
    }

    // Structured prompt for OpenAI
    const promptForAnalysis = `
Analyze this prompt: "${promptText}"

Based on the prompt gap analyzer framework, I need:

1. A list of specific questions (8-12) that would help gather more context about this prompt. These should be detailed questions that require explanations.

2. A list of variables (5-8) that might be needed for this prompt. These should be simple placeholders that can be filled in with specific values like names, dates, numbers, etc.

3. A master command that summarizes what the prompt is trying to achieve.

4. An enhanced version of the original prompt with the variables included as placeholders in the format {{VariableName}}.

Please format your response as a valid JSON with these keys:
- questions: array of objects with id, text, category (Task, Persona, Conditions, or Instructions)
- variables: array of objects with id, name
- masterCommand: string
- enhancedPrompt: string
`;

    // Make request to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: promptForAnalysis }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log("OpenAI response:", JSON.stringify(data));

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from OpenAI");
    }

    const content = data.choices[0].message.content;
    let parsedContent;
    
    try {
      // Try to parse the JSON directly
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      console.log("Raw content:", content);
      
      // If direct parsing fails, try to extract JSON using regex
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedContent = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error("Failed to extract and parse JSON:", e2);
          throw new Error("Invalid JSON response from OpenAI");
        }
      } else {
        throw new Error("Could not extract JSON from OpenAI response");
      }
    }

    // Process the questions to ensure they have the required format
    const processedQuestions = (parsedContent.questions || []).map((q: any, index: number) => ({
      id: q.id || `q${index + 1}`,
      text: q.text || "Missing question text",
      isRelevant: null,
      answer: "",
      category: q.category || "Task"
    }));

    // Process variables
    const processedVariables = (parsedContent.variables || []).map((v: any, index: number) => ({
      id: v.id || `v${index + 1}`,
      name: v.name || `Variable${index + 1}`,
      value: "",
      isRelevant: null
    }));

    // Construct the response
    const analysisResult = {
      questions: processedQuestions,
      variables: processedVariables,
      masterCommand: parsedContent.masterCommand || "",
      enhancedPrompt: parsedContent.enhancedPrompt || promptText
    };

    console.log("Analysis result:", JSON.stringify(analysisResult));

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in analyze-prompt function:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
