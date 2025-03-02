
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { promptText, primaryToggle, secondaryToggle } = requestData;
    
    if (!promptText) {
      console.error("Missing promptText in request");
      return new Response(
        JSON.stringify({ error: "Missing promptText in request" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Create a read-only Supabase client 
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    console.log(`Analyzing prompt: "${promptText.substring(0, 50)}..."`);
    console.log(`Primary toggle: ${primaryToggle}, Secondary toggle: ${secondaryToggle}`);
    
    // Call OpenAI API to analyze the prompt
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error("OpenAI API key not found");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured on the server" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Customize the system prompt based on the selected toggles
    let systemPrompt = `You are an expert prompt engineer using a four-pillar framework to analyze prompts and suggest improvements. The four pillars are:

Task: What needs to be done
Persona: Who is doing it and their tone/style
Conditions: Requirements and limitations
Instructions: Step-by-step process to follow

Based on the user's input prompt, generate:

1. EXACTLY 8 SIMPLE questions (2 per pillar) that would help improve the prompt. These questions should:
   - Be extremely simple and easy to understand, even for non-experts
   - Focus on getting important context about what the user wants
   - Avoid questions about variable placeholders (like recipient names or specific terms)
   - Be organized under the four pillars (Task, Persona, Conditions, Instructions)

2. EXACTLY 8 variables (2 per pillar) that would make the prompt reusable. Variables should:
   - Be ONLY single words or compound terms (camelCase or PascalCase)
   - Be elements that can be replaced WITHOUT changing the meaning/context
   - Examples: "Recipient", "CompanyName", "ProductName", "Deadline", "SignatureLine"
   - NOT be context-based items like "MessagePurpose" or "Reasons" that affect content
   - A good test: if you replace the variable, the prompt still works with the same structure

3. A master command that summarizes what the enhanced prompt will do
4. An enhanced prompt template that incorporates the variables and follows the four-pillar framework

Only include {{VariableName}} placeholders for true swappable variables that don't affect context.`;

    // Add toggle-specific instructions
    if (primaryToggle === 'complex') {
      systemPrompt += "\nMake questions and variables suitable for complex reasoning tasks that involve multiple steps of logical thinking.";
    } else if (primaryToggle === 'math') {
      systemPrompt += "\nMake questions and variables suitable for mathematical problem-solving tasks.";
    } else if (primaryToggle === 'coding') {
      systemPrompt += "\nMake questions and variables suitable for code generation or programming tasks.";
    } else if (primaryToggle === 'copilot') {
      systemPrompt += "\nMake questions and variables suitable for creating an AI assistant (copilot) that will help users with specific tasks.";
    }
    
    if (secondaryToggle === 'token') {
      systemPrompt += "\nOptimize the prompt to use as few tokens as possible while maintaining clarity.";
    } else if (secondaryToggle === 'strict') {
      systemPrompt += "\nMake the prompt very specific and structured to ensure consistent outputs.";
    } else if (secondaryToggle === 'creative') {
      systemPrompt += "\nMake the prompt encourage creative and diverse outputs.";
    }

    // Prepare the OpenAI request
    console.log("Sending request to OpenAI");
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this prompt: "${promptText}"` }
          ],
          response_format: { type: "json_object" }
        }),
      });
    } catch (fetchError) {
      console.error("Error fetching from OpenAI:", fetchError);
      return new Response(
        JSON.stringify({ error: `Failed to connect to OpenAI: ${fetchError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error response:', errorData);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${errorData}` }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const data = await response.json();
    console.log('OpenAI response received');
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from OpenAI:', JSON.stringify(data).substring(0, 200));
      return new Response(
        JSON.stringify({ error: "Invalid response format from OpenAI" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extract the content from the OpenAI response
    const content = data.choices[0].message.content;
    console.log('Parsed content:', content.substring(0, 100) + '...');
    
    try {
      const parsedContent = JSON.parse(content);
      
      // Transform the data to match our expected format
      const result = {
        questions: [],
        variables: [],
        masterCommand: parsedContent.masterCommand || '',
        enhancedPrompt: parsedContent.enhancedPrompt || ''
      };
      
      // Process questions
      if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
        result.questions = parsedContent.questions.map((q: any, index: number) => ({
          id: `q${index + 1}`,
          text: q.text || q.question || '',
          category: q.category || q.pillar || 'Other',
          isRelevant: null,
          answer: ''
        }));
      }
      
      // Process variables
      if (parsedContent.variables && Array.isArray(parsedContent.variables)) {
        result.variables = parsedContent.variables.map((v: any, index: number) => ({
          id: `v${index + 1}`,
          name: v.name || '',
          value: v.value || '',
          category: v.category || v.pillar || 'Other',
          isRelevant: null
        }));
      }
      
      console.log(`Processed ${result.questions.length} questions and ${result.variables.length} variables`);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Return a fallback with mock data in case we couldn't parse the OpenAI response
      const mockResult = {
        questions: Array(8).fill(0).map((_, i) => ({
          id: `q${i + 1}`,
          text: `Sample question ${i + 1}?`,
          category: ['Task', 'Persona', 'Conditions', 'Instructions'][Math.floor(i / 2)],
          isRelevant: null,
          answer: ''
        })),
        variables: Array(8).fill(0).map((_, i) => ({
          id: `v${i + 1}`,
          name: `Variable${i + 1}`,
          value: '',
          category: ['Task', 'Persona', 'Conditions', 'Instructions'][Math.floor(i / 2)],
          isRelevant: null
        })),
        masterCommand: "This is a fallback master command due to parsing error",
        enhancedPrompt: promptText + "\n\n[Enhanced version would be here - encountered a parsing error]"
      };
      
      console.log('Returning fallback mock data due to parsing error');
      return new Response(JSON.stringify(mockResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
