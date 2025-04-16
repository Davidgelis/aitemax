
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAI } from "https://esm.sh/openai@4.26.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const detectTechnicalTerms = (variableName: string, context: string) => {
  const technicalTermPatterns = [
    {
      pattern: /range/i,
      term: "Range",
      explanation: "A set of cells in a spreadsheet, typically expressed as A1:B10",
      example: "A1:D5 selects cells from A1 to D5"
    },
    {
      pattern: /formula/i,
      term: "Formula",
      explanation: "An equation that performs calculations on spreadsheet data",
      example: "=SUM(A1:A10) adds numbers in cells A1 through A10"
    },
    {
      pattern: /function/i,
      term: "Function",
      explanation: "A predefined formula that performs specific calculations",
      example: "VLOOKUP searches for a value and returns related data"
    },
    {
      pattern: /cell/i,
      term: "Cell",
      explanation: "The intersection of a row and column in a spreadsheet",
      example: "B3 refers to the cell in column B, row 3"
    },
    {
      pattern: /pivot/i,
      term: "Pivot Table",
      explanation: "A data summarization tool to analyze large datasets",
      example: "A pivot table can show sales totals by region and product"
    },
    {
      pattern: /sql/i,
      term: "SQL",
      explanation: "Structured Query Language used to manage databases",
      example: "SELECT * FROM users WHERE age > 18"
    },
    {
      pattern: /api/i,
      term: "API",
      explanation: "Application Programming Interface for software communication",
      example: "Using the Weather API to get forecast data"
    },
    {
      pattern: /json/i,
      term: "JSON",
      explanation: "JavaScript Object Notation, a data interchange format",
      example: '{"name": "John", "age": 30}'
    },
    // Add more patterns as needed
  ];

  const detectedTerms = technicalTermPatterns.filter(pattern => 
    pattern.pattern.test(variableName) || pattern.pattern.test(context)
  );

  return detectedTerms.map(({ term, explanation, example }) => ({
    term,
    explanation,
    example
  }));
};

// Helper function to extract variables from the prompt text
const extractVariables = (text: string) => {
  const variableRegex = /{{\s*VAR:\s*([a-zA-Z0-9_-]+)\s*}}/;
  let match;
  const variables = [];
  const usedIds = new Set();

  while ((match = variableRegex.exec(text)) !== null) {
    const id = match[1];
    if (!usedIds.has(id)) {
      variables.push({
        id: id,
        name: '',
        value: '',
        isRelevant: null,
        category: 'Custom',
        code: ''
      });
      usedIds.add(id);
    }
  }

  return variables;
};

// Update the existing variables processing to include technical terms
const processVariables = (text: string, context: string) => {
  const extractedVariables = extractVariables(text);
  const variables = extractedVariables.map((variable, index) => ({
    ...variable,
    name: `Variable ${index + 1}`,
    value: '',
    isRelevant: null,
    category: 'Custom',
    code: `VAR_${index + 1}`
  }));

  return variables.map(variable => ({
    ...variable,
    technicalTerms: detectTechnicalTerms(variable.name, context)
  }));
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      promptText,
      primaryToggle,
      secondaryToggle,
      userId,
      promptId,
      websiteData,
      imageData,
      smartContextData,
      inputTypes,
      model
    } = await req.json();

    console.log("analyze-prompt called with:", {
      promptText: promptText ? `${promptText.substring(0, 50)}...` : "empty",
      hasImages: !!imageData && Array.isArray(imageData) && imageData.length > 0,
      hasWebsiteContext: !!websiteData && !!websiteData.url,
      hasSmartContext: !!smartContextData && !!smartContextData.context,
      inputTypes,
      uploadedImagesCount: imageData?.length || 0,
      model
    });

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openAIApiKey
    });

    // Build messages array for the OpenAI API
    const messages = [];

    // Add system message
    let systemMessage = `You are an expert prompt engineer. Your job is to analyze a prompt and identify key questions and variables that will help improve the prompt.
      You will return a JSON object containing:
      - questions: An array of questions that need to be answered to improve the prompt.
      - variables: An array of variables that need to be defined to improve the prompt.
      - masterCommand: A string containing the master command of the prompt.
      - enhancedPrompt: A string containing the enhanced prompt.`;

    if (primaryToggle) {
      systemMessage += `\nThe user has selected the following primary toggle: ${primaryToggle}`;
    }

    if (secondaryToggle) {
      systemMessage += `\nThe user has selected the following secondary toggle: ${secondaryToggle}`;
    }

    messages.push({ role: "system", content: systemMessage });

    // Add user message
    let userMessage = `Analyze the following prompt:\n${promptText}\n\n`;

    if (websiteData && websiteData.url) {
      userMessage += `Also, consider the content of the following website: ${websiteData.url}. Instructions: ${websiteData.instructions}\n\n`;
    }

    if (imageData && Array.isArray(imageData) && imageData.length > 0) {
      userMessage += `Also, consider the following images:\n${JSON.stringify(imageData)}\n\n`;
    }

    if (smartContextData && smartContextData.context) {
      userMessage += `Also, consider the following context: ${smartContextData.context}. Usage Instructions: ${smartContextData.usageInstructions}\n\n`;
    }

    messages.push({ role: "user", content: userMessage });

    console.log("Sending request to OpenAI with system message length:", systemMessage.length);
    console.log("User message length:", userMessage.length);
    console.log("Using model:", model);

    try {
      const completion = await openai.chat.completions.create({
        model: model || "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;

      console.log("Received response from OpenAI:", content);

      let questions = [];
      let variables = [];
      let masterCommand = "";
      let enhancedPrompt = "";

      try {
        const data = JSON.parse(content);
        questions = data.questions || [];
        variables = data.variables || [];
        masterCommand = data.masterCommand || "";
        enhancedPrompt = data.enhancedPrompt || "";
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        // Extract variables using regex
        variables = processVariables(promptText, content);
      }

      // If variables are not extracted via JSON, extract them using regex
      if (!variables || variables.length === 0) {
        variables = processVariables(promptText, content);
      }

      // Process technical terms for each variable
      variables = variables.map(variable => {
        const technicalTerms = detectTechnicalTerms(variable.name, promptText);
        return {
          ...variable,
          technicalTerms: technicalTerms.length > 0 ? technicalTerms : undefined
        };
      });

      // Log the extracted data
      console.log("Extracted questions:", questions.length);
      console.log("Extracted variables:", variables.length);
      console.log("Master command:", masterCommand);
      console.log("Enhanced prompt:", enhancedPrompt.substring(0, 50) + "...");

      return new Response(
        JSON.stringify({
          questions,
          variables,
          masterCommand,
          enhancedPrompt,
          usage: completion.usage || { prompt_tokens: 0, completion_tokens: 0 },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (openaiError) {
      console.error("Error calling OpenAI API:", openaiError);
      return new Response(
        JSON.stringify({ error: openaiError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in analyze-prompt function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
