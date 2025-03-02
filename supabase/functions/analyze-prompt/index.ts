
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { promptText, primaryToggle, secondaryToggle } = await req.json();
    
    if (!promptText) {
      throw new Error('Prompt text is required');
    }

    console.log('Analyzing prompt:', promptText);
    console.log('Primary toggle:', primaryToggle);
    console.log('Secondary toggle:', secondaryToggle);

    const promptGapAnalyzerSystem = {
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

    // Construct the message for the AI based on the type of prompt selected
    let systemMessage = `You are a prompt improvement expert. Analyze the following prompt from a user interested in ${primaryToggle || 'general'} content with a ${secondaryToggle || 'standard'} approach.`;
    
    // Add specific instructions based on toggles
    if (primaryToggle === 'complex') {
      systemMessage += " Focus on complex reasoning aspects and how to improve logical structures.";
    } else if (primaryToggle === 'math') {
      systemMessage += " Pay special attention to mathematical clarity and precision.";
    } else if (primaryToggle === 'coding') {
      systemMessage += " Emphasize proper code structure and algorithmic approach.";
    } else if (primaryToggle === 'copilot') {
      systemMessage += " Evaluate this as a system prompt for an AI assistant, focusing on instruction clarity.";
    }
    
    if (secondaryToggle === 'token') {
      systemMessage += " Prioritize token efficiency in your recommendations.";
    } else if (secondaryToggle === 'strict') {
      systemMessage += " Provide very specific and structured recommendations.";
    } else if (secondaryToggle === 'creative') {
      systemMessage += " Offer creative alternatives while maintaining the core intent.";
    }

    // Add the gap analyzer instructions
    systemMessage += " Use the Prompt Gap Analyzer framework to identify gaps in the user's prompt.";
    
    // Call OpenAI API to generate analysis
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMessage },
          { 
            role: 'user', 
            content: `Please analyze this prompt using the Prompt Gap Analyzer framework. The prompt is: "${promptText}". Return your analysis as a valid JSON object with the structure matching the output_format provided in the system message, including questions for each pillar and any variable placeholders you identify.` 
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response received');

    // Extract the content from the OpenAI response
    const analysisContent = openaiData.choices[0].message.content;
    console.log('Analysis content:', analysisContent);

    // Parse the JSON from the OpenAI response
    let analysisJson;
    try {
      // First attempt: try to parse directly
      analysisJson = JSON.parse(analysisContent);
    } catch (e) {
      // Second attempt: try to extract JSON if wrapped in markdown or other text
      const jsonMatch = analysisContent.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisContent.match(/{[\s\S]*?}/);
      
      if (jsonMatch) {
        try {
          analysisJson = JSON.parse(jsonMatch[0].replace(/```json\n|```/g, '').trim());
        } catch (innerError) {
          console.error('Failed to parse extracted JSON:', innerError);
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        console.error('Failed to parse JSON and no JSON block found:', e);
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Convert the gap questions into the format expected by the frontend
    const questions = [];
    let questionId = 1;

    // Add questions from each pillar
    for (const pillar of ['GapTask', 'GapPersona', 'GapConditions', 'GapInstructions']) {
      if (analysisJson[pillar] && analysisJson[pillar] !== 'Complete') {
        const pillarQuestions = Array.isArray(analysisJson[pillar]) 
          ? analysisJson[pillar] 
          : [analysisJson[pillar]];
          
        for (const q of pillarQuestions) {
          if (typeof q === 'string' && q.trim()) {
            questions.push({
              id: `q${questionId++}`,
              text: q.trim(),
              isRelevant: null,
              answer: ""
            });
          }
        }
      }
    }

    // Extract potential variables from the prompt
    const variableRegex = /\{\{([^}]+)\}\}|%([^%]+)%|\$([^$]+)\$/g;
    const matches = [...promptText.matchAll(variableRegex)];
    
    const variables = matches.map((match, index) => {
      const variableName = match[1] || match[2] || match[3] || `Variable ${index + 1}`;
      return {
        id: `v${index + 1}`,
        name: variableName.trim(),
        value: "",
        isRelevant: true
      };
    });

    // If no variables found, provide some default suggestions
    if (variables.length === 0) {
      // Base on the type of toggle selected
      if (primaryToggle === 'complex') {
        variables.push(
          { id: "v1", name: "Audience", value: "", isRelevant: true },
          { id: "v2", name: "Context", value: "", isRelevant: true },
          { id: "v3", name: "OutputFormat", value: "", isRelevant: true }
        );
      } else if (primaryToggle === 'math') {
        variables.push(
          { id: "v1", name: "PrecisionLevel", value: "", isRelevant: true },
          { id: "v2", name: "NumberFormat", value: "", isRelevant: true },
          { id: "v3", name: "ShowWorkingSteps", value: "", isRelevant: true }
        );
      } else if (primaryToggle === 'coding') {
        variables.push(
          { id: "v1", name: "Language", value: "", isRelevant: true },
          { id: "v2", name: "TaskComplexity", value: "", isRelevant: true },
          { id: "v3", name: "IncludeComments", value: "", isRelevant: true }
        );
      } else if (primaryToggle === 'copilot') {
        variables.push(
          { id: "v1", name: "AssistantName", value: "", isRelevant: true },
          { id: "v2", name: "PersonalityTrait", value: "", isRelevant: true },
          { id: "v3", name: "KnowledgeDomain", value: "", isRelevant: true }
        );
      } else {
        variables.push(
          { id: "v1", name: "Name", value: "", isRelevant: true },
          { id: "v2", name: "Purpose", value: "", isRelevant: true },
          { id: "v3", name: "Context", value: "", isRelevant: true }
        );
      }
    }

    // Generate an enhanced prompt based on the analysis
    let enhancedPrompt = `# Enhanced ${primaryToggle || 'Standard'} Prompt`;
    
    // Add sections based on the four pillars
    enhancedPrompt += `\n\n## Task\n${promptText}`;
    
    if (analysisJson.GapTask && analysisJson.GapTask !== 'Complete') {
      enhancedPrompt += `\n\n[Task details needed based on questions]`;
    }
    
    enhancedPrompt += `\n\n## Persona\n`;
    if (analysisJson.GapPersona && analysisJson.GapPersona !== 'Complete') {
      enhancedPrompt += `[Define target persona]`;
    } else {
      enhancedPrompt += `Standard ${primaryToggle || 'general'} assistant`;
    }
    
    enhancedPrompt += `\n\n## Conditions\n`;
    if (analysisJson.GapConditions && analysisJson.GapConditions !== 'Complete') {
      enhancedPrompt += `[Specify conditions and constraints]`;
    } else {
      enhancedPrompt += `Follow standard best practices for ${primaryToggle || 'general'} content`;
    }
    
    enhancedPrompt += `\n\n## Instructions\n`;
    if (analysisJson.GapInstructions && analysisJson.GapInstructions !== 'Complete') {
      enhancedPrompt += `[Provide detailed instructions]`;
    } else {
      enhancedPrompt += `Execute the task as described above`;
    }
    
    // Add suggested variables section
    enhancedPrompt += `\n\n## Variables\n`;
    for (const variable of variables) {
      enhancedPrompt += `- {{${variable.name}}}\n`;
    }

    // Generate a master command/summary
    const masterCommand = `Analyze and enhance this ${primaryToggle || 'general'} prompt with ${secondaryToggle || 'standard'} approach, addressing gaps in Task, Persona, Conditions, and Instructions.`;

    // Return the analysis results
    return new Response(
      JSON.stringify({
        questions,
        variables,
        enhancedPrompt,
        masterCommand,
        rawAnalysis: analysisJson
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
