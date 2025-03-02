
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    // Get request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body", 
          questions: [], 
          variables: [] 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { promptText, primaryToggle, secondaryToggle } = body;
    
    if (!promptText) {
      console.error("Missing promptText in request");
      return new Response(
        JSON.stringify({ 
          error: "Missing promptText", 
          questions: [], 
          variables: [] 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Logging for debugging
    console.log("Analyzing prompt:", promptText);
    console.log("Primary toggle:", primaryToggle);
    console.log("Secondary toggle:", secondaryToggle);

    // Prepare to call OpenAI API
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openAiApiKey) {
      console.error("Missing OpenAI API key");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing API key", 
          questions: [], 
          variables: [] 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare system message with instructions adjusted based on primary and secondary toggles
    let systemMessage = `
      You are an AI prompt analyzer that helps users create better prompts. Your task is to analyze a prompt and provide:
      
      1. A list of relevant questions the user should answer to enhance their prompt's specificity and clarity.
      2. A list of variables that could be extracted from the prompt to make it more reusable.
      
      Important guidelines:
      - Questions should focus on gathering context, background information, and specific details.
      - Variables should ONLY be individual terms or short phrases that can be directly replaced without changing the meaning.
      - Variables should NOT include context questions or entire sections.
      - Example of proper variables: recipient_name, product_name, company_name, deadline_date.
      - Output JSON format must include 'questions' and 'variables' arrays.
      
      For questions:
      - Each question should have an 'id', 'text', and 'description' field.
      - Focus on 5-8 most important questions only.
      
      For variables:
      - Each variable should have an 'id', 'name', and 'description' field.
      - Identify 3-5 key variables that make the prompt reusable.
    `;

    // Customize system message based on toggles
    if (primaryToggle === 'coding') {
      systemMessage += `
        Since this is a coding-related prompt, focus on:
        - Technical specifications
        - Language/framework preferences
        - Code style conventions
        - Performance requirements
      `;
    } else if (primaryToggle === 'creative') {
      systemMessage += `
        Since this is a creative prompt, focus on:
        - Tone and style preferences
        - Target audience
        - Creative inspiration sources
        - Emotional impact goals
      `;
    } else if (primaryToggle === 'business') {
      systemMessage += `
        Since this is a business prompt, focus on:
        - Business objectives
        - Target market
        - Competitive positioning
        - Success metrics
      `;
    }

    if (secondaryToggle === 'strict') {
      systemMessage += `
        Apply strict standards to your analysis:
        - Be very selective with your questions
        - Only include essential variables
        - Focus on precision and clarity
      `;
    } else if (secondaryToggle === 'detailed') {
      systemMessage += `
        Provide detailed analysis:
        - Include more comprehensive questions
        - Identify more potential variables
        - Explore nuances and edge cases
      `;
    }

    // Call OpenAI API
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemMessage
            },
            {
              role: "user",
              content: `Analyze this prompt: "${promptText}"`
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("OpenAI API error:", response.status, errorData);
        throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        console.error("Unexpected OpenAI API response format:", data);
        throw new Error("Unexpected API response format");
      }

      const content = data.choices[0].message.content;
      console.log("OpenAI response content:", content);

      // Parse the response content as JSON
      let parsedContent;
      try {
        // Look for JSON in the response using regex
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                          content.match(/```\n([\s\S]*?)\n```/) || 
                          content.match(/{[\s\S]*}/);
                          
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
        parsedContent = JSON.parse(jsonString.replace(/```/g, '').trim());
      } catch (error) {
        console.error("Error parsing OpenAI response as JSON:", error, "Content:", content);
        
        // Return a graceful error response with 200 status
        return new Response(
          JSON.stringify({ 
            error: "Could not parse AI response", 
            rawResponse: content,
            questions: [], 
            variables: [] 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Enhance the prompt based on the questions and variables
      const enhancedPrompt = generateEnhancedPrompt(promptText, parsedContent);
      
      // Generate a master command
      let masterCommand = "Create a highly effective prompt";
      if (primaryToggle) {
        const toggleType = 
          primaryToggle === 'coding' ? "coding-related" : 
          primaryToggle === 'creative' ? "creative" : 
          primaryToggle === 'business' ? "business-oriented" : "";
        
        if (toggleType) {
          masterCommand += ` for ${toggleType} content`;
        }
      }

      // Combine everything into the final response
      const finalResponse = {
        ...parsedContent,
        enhancedPrompt,
        masterCommand
      };

      return new Response(
        JSON.stringify(finalResponse),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      
      // Return a graceful error response with 200 status and mock data
      return new Response(
        JSON.stringify({ 
          error: `Error processing your request: ${error.message}`, 
          questions: [
            {
              id: "q1",
              text: "What is the specific goal of your prompt?",
              description: "Define the exact outcome you want to achieve"
            },
            {
              id: "q2",
              text: "Who is the intended audience?",
              description: "Specify who will be reading or using the output"
            }
          ],
          variables: [
            {
              id: "v1",
              name: "Topic",
              description: "The main subject matter of your prompt"
            },
            {
              id: "v2", 
              name: "Format",
              description: "The format of the desired output (e.g., email, report, code)"
            }
          ]
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in analyze-prompt function:", error);
    
    // Return a graceful error response with 200 status
    return new Response(
      JSON.stringify({
        error: `Unhandled server error: ${error.message}`,
        questions: [],
        variables: []
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to generate an enhanced prompt
function generateEnhancedPrompt(originalPrompt: string, analysisResult: any) {
  const { questions = [], variables = [] } = analysisResult;
  
  // Start with the original prompt
  let enhancedPrompt = originalPrompt.trim();
  
  // Add context from questions
  if (questions.length > 0) {
    enhancedPrompt += "\n\nContext:";
    questions.forEach((q: any) => {
      enhancedPrompt += `\n- ${q.text}`;
    });
  }
  
  // Add variable placeholders
  if (variables.length > 0) {
    enhancedPrompt += "\n\nVariables:";
    variables.forEach((v: any) => {
      enhancedPrompt += `\n- {{${v.name}}}: ${v.description}`;
    });
  }
  
  return enhancedPrompt;
}
