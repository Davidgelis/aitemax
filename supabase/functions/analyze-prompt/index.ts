
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSystemPrompt } from './system-prompt.ts';
import { extractQuestions, extractVariables, extractMasterCommand, extractEnhancedPrompt } from './utils/extractors.ts';
import { analyzePromptWithAI } from './openai-client.ts';
import { generateContextQuestionsForPrompt, generateContextualVariablesForPrompt } from './utils/generators.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Starting analyze-prompt function with enhanced prompt-based question generation");
    
    const requestBody = await req.json();
    const { 
      promptText, 
      primaryToggle, 
      secondaryToggle, 
      template,
      websiteData,
      imageData,
      smartContextData,
      model = 'gpt-4o'
    } = requestBody;
    
    console.log("Request received with:", {
      promptLength: promptText?.length,
      promptFirstFewWords: promptText?.split(' ').slice(0, 5).join(' '),
      hasImageData: !!imageData,
      imageDataLength: imageData?.length,
      hasSmartContext: !!smartContextData?.context,
      hasWebsiteData: !!websiteData?.url,
      templateName: template?.name || 'none',
      templatePillars: template?.pillars?.length || 0,
      model
    });

    if (!promptText?.trim()) {
      throw new Error("Prompt text is required");
    }
    
    // Initialize empty arrays for questions and variables
    let questions = [];
    let variables = [];
    let masterCommand = "";
    let enhancedPrompt = promptText;
    
    try {
      // Safely extract user intent with error handling
      const userIntent = extractUserIntent(promptText || '');
      const missingInfoCategories = identifyMissingInformation(promptText || '');
      
      console.log(`Extracted user intent: "${userIntent}"`);
      console.log(`Missing information categories: ${missingInfoCategories.join(', ')}`);
      
      // Check if prompt is too short/simple for questions
      const isPromptSimple = (promptText?.length || 0) < 50 || (promptText?.split(' ').length || 0) < 10;
      console.log(`Prompt simplicity check: ${isPromptSimple ? 'Simple prompt' : 'Complex prompt'}`);

      // Enhanced image data validation
      let hasValidImageData = false;
      if (Array.isArray(imageData) && imageData.length > 0) {
        hasValidImageData = imageData.some(img => img && img.base64 && img.context);
        console.log(`Image data validation: ${hasValidImageData ? 'Valid' : 'Invalid'}`);
      }

      // Create system prompt
      const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
      
      // Build the enhanced context safely
      let enhancedContext = promptText || '';
      let imageBase64 = null;
      let imageContext = '';
      
      // Enhanced image processing with better logging and error handling
      if (imageData && Array.isArray(imageData) && imageData.length > 0) {
        try {
          const firstImage = imageData[0];
          if (firstImage?.base64) {
            imageBase64 = firstImage.base64.replace(/^data:image\/[a-z]+;base64,/, '');
            imageContext = firstImage.context || '';
            enhancedContext = `${enhancedContext}\n\nIMAGE CONTEXT: ${imageContext}`;
          }
        } catch (imageErr) {
          console.error("Error processing image:", imageErr);
        }
      }
      
      // Add missing information categories to the context
      if (missingInfoCategories.length > 0) {
        enhancedContext = `${enhancedContext}\n\nMISSING INFORMATION CATEGORIES: ${missingInfoCategories.join(', ')}`;
      }
      
      // Add smart context if available
      if (smartContextData?.context) {
        enhancedContext = `${enhancedContext}\n\nADDITIONAL CONTEXT:\n${smartContextData.context}`;
      }
      
      // Add website context if available
      if (websiteData?.url) {
        enhancedContext = `${enhancedContext}\n\nWEBSITE CONTEXT:\nURL: ${websiteData.url}\n${websiteData.instructions || ''}`;
      }

      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error("OpenAI API key is not configured");
      }

      // Call OpenAI API with enhanced error handling
      const { content } = await analyzePromptWithAI(
        enhancedContext,
        systemPrompt,
        apiKey,
        smartContextData?.context || '',
        imageBase64,
        model
      );

      // Generate fallback questions if no AI response
      if (!content) {
        console.log("No content from AI, generating fallback questions");
        questions = generateDefaultQuestions(promptText, template);
      } else {
        try {
          const parsedContent = JSON.parse(content);
          
          // Use AI-generated questions if they exist and are valid
          if (Array.isArray(parsedContent?.questions) && parsedContent.questions.length > 0) {
            questions = parsedContent.questions;
          } else {
            questions = generateDefaultQuestions(promptText, template);
          }
          
          // Use AI-generated variables if they exist
          if (Array.isArray(parsedContent?.variables)) {
            variables = parsedContent.variables;
          }
          
          masterCommand = parsedContent?.masterCommand || "";
          enhancedPrompt = parsedContent?.enhancedPrompt || promptText;
          
        } catch (parseError) {
          console.error("Failed to parse AI response:", parseError);
          questions = generateDefaultQuestions(promptText, template);
        }
      }
      
      // Ensure we have at least some questions to proceed
      if (questions.length === 0) {
        questions = generateDefaultQuestions(promptText, template);
      }
      
    } catch (analysisError) {
      console.error("Error in prompt analysis:", analysisError);
      // Ensure we have fallback questions even if analysis fails
      questions = generateDefaultQuestions(promptText, template);
    }

    return new Response(
      JSON.stringify({
        questions,
        variables,
        masterCommand,
        enhancedPrompt,
        debug: {
          questionsGenerated: questions.length,
          questionsPrefilled: questions.filter(q => q.answer).length,
          variablesGenerated: variables.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    
    // Generate default questions even in case of error
    const defaultQuestions = generateDefaultQuestions(requestBody?.promptText || '', requestBody?.template);
    
    return new Response(
      JSON.stringify({
        questions: defaultQuestions,
        variables: [],
        masterCommand: "",
        enhancedPrompt: requestBody?.promptText || "",
        error: error.message,
        debug: {
          errorOccurred: true,
          questionsGenerated: defaultQuestions.length,
          errorMessage: error.message
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

// Helper function to extract user intent safely
function extractUserIntent(promptText: string): string {
  if (!promptText) return '';
  
  try {
    if (promptText.length < 60) return promptText;
    
    const firstSentence = promptText.split(/[.!?]/).find(s => s.trim().length > 0);
    if (firstSentence && firstSentence.length < 80) {
      return firstSentence.trim();
    }
    
    return promptText.split(' ').slice(0, 10).join(' ');
  } catch (error) {
    console.error("Error extracting user intent:", error);
    return promptText.substring(0, 100);
  }
}

// Helper function to identify missing information safely
function identifyMissingInformation(promptText: string): string[] {
  if (!promptText) return [];
  
  try {
    const missingCategories = [];
    const promptLower = promptText.toLowerCase();
    
    // Extract objects safely
    const objects = extractObjectsFromPrompt(promptText);
    
    objects.forEach(obj => {
      if (obj && typeof obj === 'string') {
        const objLower = obj.toLowerCase();
        
        // Check for color information safely
        if (!promptLower.includes(`${objLower} color`) &&
            !hasColorMentioned(promptLower, objLower)) {
          missingCategories.push(`${obj} color`);
        }
        
        // Check for size information safely
        if (!promptLower.includes(`${objLower} size`) &&
            !hasSizeMentioned(promptLower, objLower)) {
          missingCategories.push(`${obj} size`);
        }
      }
    });
    
    // Add basic missing categories
    if (!promptLower.includes('background')) missingCategories.push('background');
    if (!promptLower.includes('time of day')) missingCategories.push('time of day');
    
    return missingCategories;
  } catch (error) {
    console.error("Error identifying missing information:", error);
    return [];
  }
}

function hasColorMentioned(text: string, obj: string): boolean {
  const colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown'];
  return colors.some(color => text.includes(`${color} ${obj}`));
}

function hasSizeMentioned(text: string, obj: string): boolean {
  const sizes = ['big', 'small', 'large', 'tiny', 'huge'];
  return sizes.some(size => text.includes(`${size} ${obj}`));
}

function extractObjectsFromPrompt(promptText: string): string[] {
  try {
    const commonObjects = ['dog', 'cat', 'person', 'house', 'car', 'tree'];
    const words = promptText.toLowerCase().split(/\s+/);
    return commonObjects.filter(obj => words.includes(obj));
  } catch (error) {
    console.error("Error extracting objects:", error);
    return [];
  }
}

// Function to generate default questions when AI analysis fails
function generateDefaultQuestions(promptText: string, template: any): any[] {
  try {
    const defaultQuestions = [];
    
    // Get template pillars or use default ones
    const pillars = template?.pillars || [
      { title: "SUBJECT & COMPOSITION", description: "Core elements and their arrangement" },
      { title: "STYLE & AESTHETIC", description: "Visual style and artistic choices" },
      { title: "ENVIRONMENT & CONTEXT", description: "Setting and surroundings" },
      { title: "MOOD & INTENTION", description: "Emotional impact and purpose" }
    ];
    
    // Generate one basic question per pillar
    pillars.forEach((pillar: any) => {
      if (pillar?.title) {
        defaultQuestions.push({
          id: crypto.randomUUID(),
          text: `What are your requirements for ${pillar.title.toLowerCase()}?`,
          category: pillar.title,
          isRelevant: true,
          answer: ""
        });
      }
    });
    
    // Add some general questions
    defaultQuestions.push({
      id: crypto.randomUUID(),
      text: "What is the main focus or subject?",
      category: "SUBJECT & COMPOSITION",
      isRelevant: true,
      answer: ""
    });
    
    defaultQuestions.push({
      id: crypto.randomUUID(),
      text: "Are there any specific elements that must be included?",
      category: "STYLE & AESTHETIC",
      isRelevant: true,
      answer: ""
    });
    
    return defaultQuestions;
  } catch (error) {
    console.error("Error generating default questions:", error);
    // Return absolute minimum set of questions if everything else fails
    return [{
      id: crypto.randomUUID(),
      text: "What are the key elements you want to include?",
      category: "GENERAL",
      isRelevant: true,
      answer: ""
    }];
  }
}
