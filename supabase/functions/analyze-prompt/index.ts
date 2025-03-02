
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
    const { promptText, primaryToggle, secondaryToggle } = await req.json();
    
    if (!promptText || !promptText.trim()) {
      throw new Error('Prompt text is required');
    }

    console.log(`Analyzing prompt: ${promptText.substring(0, 100)}...`);
    console.log(`Primary toggle: ${primaryToggle}, Secondary toggle: ${secondaryToggle}`);

    // Construct system prompt based on primary and secondary toggles
    let systemPrompt = "You are an AI prompt analyzer that helps users create better prompts.";
    
    if (primaryToggle === "complex") {
      systemPrompt += " You specialize in analyzing complex reasoning tasks.";
    } else if (primaryToggle === "math") {
      systemPrompt += " You specialize in mathematical problem-solving prompts.";
    } else if (primaryToggle === "coding") {
      systemPrompt += " You specialize in analyzing coding-related prompts.";
    } else if (primaryToggle === "copilot") {
      systemPrompt += " You specialize in analyzing prompts for creating AI copilots.";
    }
    
    if (secondaryToggle === "token") {
      systemPrompt += " You focus on making prompts token-efficient.";
    } else if (secondaryToggle === "strict") {
      systemPrompt += " You focus on creating strict, well-defined prompts.";
    } else if (secondaryToggle === "creative") {
      systemPrompt += " You focus on making prompts that encourage creative responses.";
    }

    // Construct the prompt gap analyzer prompt
    const promptGapAnalyzerJson = {
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

    // Additional instructions for variables
    const variablesInstructions = `
      After analyzing the prompt for gaps, please identify potential variables that should be parameterized in the final prompt. 
      A variable is a piece of information that might change between different uses of the prompt, such as names, dates, locations, quantities, etc.
      For each variable, provide a name and a default value if possible. Limit to 5 most important variables.
      Also, generate an enhanced version of the original prompt that incorporates these variables using {{VariableName}} syntax.
    `;

    // Combine the promptGapAnalyzerJson with variablesInstructions
    const userPrompt = `
      Analyze this prompt: "${promptText}"
      
      Use this framework to identify gaps and missing information:
      ${JSON.stringify(promptGapAnalyzerJson, null, 2)}
      
      ${variablesInstructions}
    `;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    const openAIResponse = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API Error:', openAIResponse);
      throw new Error(`OpenAI API Error: ${openAIResponse.error?.message || 'Unknown error'}`);
    }

    const aiContent = openAIResponse.choices[0].message.content;
    console.log('AI Response received:', aiContent.substring(0, 200) + '...');

    // Extract the JSON from the response if it exists
    let jsonMatch;
    try {
      // Try to find JSON in the AI response
      jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.log('No JSON found in response, parsing as regular text');
        
        // Parse the questions from the text content
        const questions = [];
        const lines = aiContent.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.endsWith('?') && trimmedLine.length > 10) {
            questions.push({
              id: `q${questions.length + 1}`,
              text: trimmedLine,
              isRelevant: null,
              answer: ''
            });
          }
        }
        
        // Extract potential variables
        const variables = [];
        const potentialVariables = ["Name", "Location", "Date", "Time", "Quantity"];
        
        potentialVariables.forEach((varName, index) => {
          variables.push({
            id: `v${index + 1}`,
            name: varName,
            value: '',
            isRelevant: null
          });
        });
        
        // Generate a basic enhanced prompt
        const enhancedPrompt = `# Enhanced Prompt\n\n${promptText}\n\n## Variables\n\nConsider using these variables:\n${variables.map(v => `- {{${v.name}}}`).join('\n')}`;
        
        const masterCommand = `Use the enhanced prompt with the specified variables`;
        
        return new Response(
          JSON.stringify({
            questions,
            variables,
            enhancedPrompt,
            masterCommand
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Try to parse the JSON
      const extractedJson = JSON.parse(jsonMatch[0]);
      console.log('Extracted JSON:', Object.keys(extractedJson));
      
      // Process the response to get questions
      const questions = [];
      
      // Process questions from the gap analysis
      ['GapTask', 'GapPersona', 'GapConditions', 'GapInstructions'].forEach(key => {
        if (extractedJson[key] && extractedJson[key] !== 'Complete') {
          const gapQuestions = Array.isArray(extractedJson[key]) 
            ? extractedJson[key] 
            : [extractedJson[key]];
            
          gapQuestions.forEach(q => {
            if (typeof q === 'string' && q.trim() && q !== 'Complete') {
              questions.push({
                id: `q${questions.length + 1}`,
                text: q.trim(),
                isRelevant: null,
                answer: ''
              });
            }
          });
        }
      });
      
      // If we have other questions outside the gap analysis format
      if (extractedJson.questions && Array.isArray(extractedJson.questions)) {
        extractedJson.questions.forEach(q => {
          if (typeof q === 'string' && q.trim()) {
            questions.push({
              id: `q${questions.length + 1}`,
              text: q.trim(),
              isRelevant: null,
              answer: ''
            });
          }
        });
      }
      
      // Process variables
      let variables = [];
      if (extractedJson.variables && Array.isArray(extractedJson.variables)) {
        variables = extractedJson.variables.map((v, index) => ({
          id: `v${index + 1}`,
          name: v.name || `Variable${index + 1}`,
          value: v.value || '',
          isRelevant: null
        }));
      } else {
        // Generate default variables based on the content
        const potentialVariables = ["Name", "Purpose", "Context", "Format", "Audience"];
        variables = potentialVariables.map((name, index) => ({
          id: `v${index + 1}`,
          name,
          value: '',
          isRelevant: null
        }));
      }
      
      // Get the enhanced prompt template
      const enhancedPrompt = extractedJson.enhancedPrompt || 
        `# Enhanced Prompt Template\n\n## Task\n${promptText}\n\n## Variables\n${variables.map(v => `- {{${v.name}}}`).join('\n')}`;
      
      // Generate master command
      const masterCommand = extractedJson.masterCommand || 
        "Use this enhanced prompt to generate high-quality responses, replacing the variables with appropriate values.";
      
      return new Response(
        JSON.stringify({
          questions,
          variables,
          enhancedPrompt,
          masterCommand
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Fallback to extracting questions and variables from text
      const questions = [];
      const lines = aiContent.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.endsWith('?') && trimmedLine.length > 10) {
          questions.push({
            id: `q${questions.length + 1}`,
            text: trimmedLine,
            isRelevant: null,
            answer: ''
          });
        }
      }
      
      // Limit to 12 questions max
      const filteredQuestions = questions.slice(0, 12);
      
      // Generate some default variables
      const variables = [
        { id: 'v1', name: 'Name', value: '', isRelevant: null },
        { id: 'v2', name: 'Purpose', value: '', isRelevant: null },
        { id: 'v3', name: 'Context', value: '', isRelevant: null },
        { id: 'v4', name: 'Format', value: '', isRelevant: null },
        { id: 'v5', name: 'Audience', value: '', isRelevant: null }
      ];
      
      const enhancedPrompt = `# Enhanced Prompt\n\n${promptText}\n\n## Variables\n\n${variables.map(v => `- {{${v.name}}}`).join('\n')}`;
      
      const masterCommand = "Use this enhanced prompt with the specified variables";
      
      return new Response(
        JSON.stringify({
          questions: filteredQuestions,
          variables,
          enhancedPrompt,
          masterCommand
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
