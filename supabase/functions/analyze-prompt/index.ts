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
    console.log("Starting analyze-prompt function with enhanced pillar-based question generation and image analysis");
    
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
    
    // Extract core user intent for better question tailoring and pre-filling
    const userIntent = extractUserIntent(promptText);
    console.log(`Extracted user intent: "${userIntent}"`);
    
    // Check if prompt is too short/simple for questions
    const isPromptSimple = promptText.length < 50 || promptText.split(' ').length < 10;
    console.log(`Prompt simplicity check: ${isPromptSimple ? 'Simple prompt' : 'Complex prompt'}`);

    // Enhanced image data validation
    let hasValidImageData = false;
    if (Array.isArray(imageData) && imageData.length > 0) {
      hasValidImageData = imageData.some(img => img && img.base64 && img.context);
      console.log(`Image data validation: ${hasValidImageData ? 'Valid' : 'Invalid'}, Images with context: ${imageData.filter(img => img.context).length}`);
      
      // Log image context to help with intent matching
      if (hasValidImageData) {
        imageData.forEach((img, i) => {
          if (img.context) {
            console.log(`Image ${i+1} context: "${img.context.substring(0, 100)}..."`);
          }
        });
      }
    }

    const systemPrompt = createSystemPrompt(primaryToggle, secondaryToggle, template);
    
    // Build the enhanced context
    let enhancedContext = promptText;
    let imageBase64 = null;
    let imageContext = '';
    
    // Enhanced image processing with better logging
    if (imageData) {
      console.log("Processing image data with intent-based validation");
      
      if (Array.isArray(imageData) && imageData.length > 0 && imageData[0]?.base64) {
        try {
          imageBase64 = imageData[0].base64.replace(/^data:image\/[a-z]+;base64,/, '');
          imageContext = imageData[0].context || '';
          enhancedContext = `${enhancedContext}\n\nIMAGE CONTEXT: ${imageContext}`;
          console.log("Successfully processed image data:", {
            hasBase64: !!imageBase64,
            base64Length: imageBase64 ? imageBase64.length : 0,
            hasContext: !!imageContext,
            contextLength: imageContext.length,
            intentFromContext: extractUserIntent(imageContext)
          });
        } catch (imageErr) {
          console.error("Error processing image:", imageErr);
          imageBase64 = null;
          imageContext = '';
        }
      } else {
        console.log("Image data validation failed:", {
          isArray: Array.isArray(imageData),
          length: Array.isArray(imageData) ? imageData.length : 0,
          firstItemHasBase64: Array.isArray(imageData) && imageData.length > 0 ? !!imageData[0]?.base64 : false
        });
      }
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

    console.log("Calling OpenAI API for intent-based analysis and pillar-based image processing");
    
    const { content } = await analyzePromptWithAI(
      enhancedContext,
      systemPrompt,
      apiKey,
      smartContextData?.context || '',
      imageBase64,
      model
    );

    console.log("Received response from OpenAI, parsing content with enhanced pillar-based analysis");

    let parsedContent;
    let imageAnalysis = null;
    
    try {
      parsedContent = JSON.parse(content);
      imageAnalysis = parsedContent.imageAnalysis;
      
      console.log("Successfully parsed JSON response", {
        hasImageAnalysis: !!imageAnalysis,
        imageAnalysisPillars: imageAnalysis ? Object.keys(imageAnalysis).join(", ") : "none",
        questionsCount: parsedContent.questions ? parsedContent.questions.length : 0,
        prefilledQuestionsCount: parsedContent.questions ? parsedContent.questions.filter(q => q.answer).length : 0
      });
    } catch (error) {
      console.error("Failed to parse content:", error);
      // Provide fallback content when parsing fails
      parsedContent = {
        questions: [],
        variables: [],
        masterCommand: "",
        enhancedPrompt: enhancedContext,
        error: error.message
      };
    }

    // Generate intent-specific questions based on user prompt and template pillars
    let questions = generateContextQuestionsForPrompt(
      enhancedContext,
      template,
      smartContextData,
      imageAnalysis,
      userIntent
    );
    
    console.log(`Generated ${questions.length} intent-based questions from template pillars (${questions.filter(q => q.answer).length} with pre-filled answers)`);

    // If we have AI-generated questions with good coverage, consider using them instead
    // But only if they have good pillar coverage, pre-filled answers, and match user intent
    const useAIQuestions = Array.isArray(parsedContent?.questions) && 
                           parsedContent.questions.length >= questions.length &&
                           parsedContent.questions.filter(q => q.answer).length >= questions.filter(q => q.answer).length;
    
    if (useAIQuestions) {
      // Check if the AI questions have good coverage across pillars and match user intent
      const aiQuestionsHaveGoodCoverage = template?.pillars?.length > 0 ?
        template.pillars.some(pillar => 
          parsedContent.questions.some(q => 
            q.category === pillar.title || q.category.includes(pillar.title)
          )
        ) : true;
      
      // Check if AI-generated questions focus on user intent
      const aiQuestionsMatchIntent = parsedContent.questions.some(q => 
        isQuestionRelatedToIntent(q.text, userIntent)
      );
      
      if (aiQuestionsHaveGoodCoverage && aiQuestionsMatchIntent) {
        console.log("Using AI-generated questions due to better intent matching and pre-filled answers");
        
        // Check for repetitive answers and deduplicate as needed
        const uniqueAnswers = new Set();
        parsedContent.questions.forEach(q => {
          if (q.answer) {
            const simpleAnswer = simplifyAnswer(q.answer);
            if (uniqueAnswers.has(simpleAnswer)) {
              // If we have this answer already, mark as duplicate
              console.log(`Found duplicate pre-filled answer for question: "${q.text.substring(0, 30)}..."`);
              q.isDuplicate = true;
            } else {
              uniqueAnswers.add(simpleAnswer);
            }
          }
        });
        
        // Filter out questions with duplicate answers
        questions = parsedContent.questions.filter(q => !q.isDuplicate);
        console.log(`Using ${questions.length} AI questions after filtering ${parsedContent.questions.length - questions.length} duplicates`);
      } else {
        console.log("Using locally generated questions for better pillar-based coverage and intent matching");
        // Keep our locally generated questions
      }
    }
    
    // Generate variables with appropriate detail level
    let variables = generateContextualVariablesForPrompt(
      enhancedContext,
      template,
      imageAnalysis,
      smartContextData,
      isPromptSimple && !hasValidImageData // Flag for concise variables
    );

    const masterCommand = extractMasterCommand(content);
    const enhancedPrompt = extractEnhancedPrompt(content);

    // Log prefilled questions by pillar to help with debugging
    const prefilledByPillar = questions
      .filter(q => q.answer)
      .reduce((acc, q) => {
        acc[q.category] = (acc[q.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    console.log("Analysis complete, returning results:", {
      questionsCount: questions.length,
      variablesCount: variables.length,
      prefilled: questions.filter(q => q.answer).length,
      prefilledByPillar,
      hasMasterCommand: !!masterCommand,
      hasEnhancedPrompt: !!enhancedPrompt,
      isPromptSimple,
      hasValidImageData,
      imageAnalysisAvailable: !!imageAnalysis,
      originalIntent: userIntent,
      pillarsCovered: questions.reduce((acc, q) => {
        if (!acc.includes(q.category)) acc.push(q.category);
        return acc;
      }, []).join(', ')
    });

    return new Response(
      JSON.stringify({
        questions,
        variables,
        masterCommand,
        enhancedPrompt,
        debug: {
          hasImageData: !!imageBase64,
          imageProcessingStatus: imageBase64 ? "processed" : "not available",
          model,
          templateUsed: template?.name || "none",
          pillarsCount: template?.pillars?.length || 0,
          questionsGenerated: questions.length,
          questionsPrefilled: questions.filter(q => q.answer).length,
          userIntent,
          isPromptSimple,
          hasValidImageData,
          imageAnalysisAvailable: !!imageAnalysis,
          sourceOfQuestions: useAIQuestions ? "AI" : "local",
          prefilledByPillar,
          pillarsCovered: questions.reduce((acc, q) => {
            if (!acc.includes(q.category)) acc.push(q.category);
            return acc;
          }, []).join(', ')
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-prompt function:', error);
    
    // Return a more graceful error response
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        questions: [],
        variables: [],
        masterCommand: "",
        enhancedPrompt: ""
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

// Helper function to extract the core user intent from prompt text
function extractUserIntent(promptText: string): string {
  if (!promptText) return '';
  
  // Try to extract an action + object pattern
  const actionObjectPattern = /(?:create|generate|make|design|draw|produce)\s+(?:a|an|the)?\s*([a-z\s]+)/i;
  const match = promptText.match(actionObjectPattern);
  
  if (match && match[1]) {
    // Return the first 5-10 words to capture the core intent
    return match[1].trim().split(/\s+/).slice(0, 10).join(' ');
  }
  
  // Fallback: just return the first 5-8 words
  return promptText.split(/\s+/).slice(0, 8).join(' ').toLowerCase();
}

// Check if a question is related to the user's intent
function isQuestionRelatedToIntent(questionText: string, userIntent: string): boolean {
  if (!userIntent) return true;
  
  const intentWords = userIntent.toLowerCase().split(/\s+/)
    .filter(w => w.length > 3) // Only use meaningful words
    .map(w => w.replace(/[^a-z]/g, '')); // Clean up the words
  
  // Check if any intent words are in the question
  return intentWords.some(word => 
    questionText.toLowerCase().includes(word)
  );
}

// Simplify an answer for duplicate detection
function simplifyAnswer(answer: string): string {
  if (!answer) return '';
  
  // Remove "Based on image analysis: " prefix
  let simplified = answer.replace(/^Based on image analysis:\s*/i, '');
  
  // Remove punctuation, normalize spaces
  simplified = simplified.replace(/[.,;:]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  
  // Keep only first 50 chars for comparison
  return simplified.substring(0, 50);
}
