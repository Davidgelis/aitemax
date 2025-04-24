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
    
    // Extract core user intent for better question tailoring and pre-filling
    const userIntent = extractUserIntent(promptText);
    const missingInfoCategories = identifyMissingInformation(promptText);
    
    console.log(`Extracted user intent: "${userIntent}"`);
    console.log(`Missing information categories: ${missingInfoCategories.join(', ')}`);
    
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

    // Create system prompt with emphasis on the user's original intent
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
    
    // Add missing information categories to the context
    enhancedContext = `${enhancedContext}\n\nMISSING INFORMATION CATEGORIES: ${missingInfoCategories.join(', ')}`;
    
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

    console.log("Calling OpenAI API with prompt-focused analysis");
    
    const { content } = await analyzePromptWithAI(
      enhancedContext,
      systemPrompt,
      apiKey,
      smartContextData?.context || '',
      imageBase64,
      model
    );

    console.log("Received response from OpenAI, parsing content with prompt-based analysis");

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

    // Check if the AI-generated questions address the missing information categories
    const aiQuestionsAddressMissingInfo = Array.isArray(parsedContent?.questions) && 
      parsedContent.questions.some(q => 
        missingInfoCategories.some(category => 
          q.text.toLowerCase().includes(category.toLowerCase())
        )
      );

    // If we have AI-generated questions that address missing info, use them
    const useAIQuestions = Array.isArray(parsedContent?.questions) && 
                           parsedContent.questions.length > 0 &&
                           (aiQuestionsAddressMissingInfo || parsedContent.questions.filter(q => q.answer).length > 0);
    
    if (useAIQuestions) {
      // Check if the AI questions match user intent
      const aiQuestionsMatchIntent = parsedContent.questions.some(q => 
        isQuestionRelatedToIntent(q.text, userIntent)
      );
      
      // Log analysis of AI questions
      console.log("AI question quality analysis:", {
        addressesMissingInfo: aiQuestionsAddressMissingInfo,
        matchesUserIntent: aiQuestionsMatchIntent,
        prefilledCount: parsedContent.questions.filter(q => q.answer).length,
        totalCount: parsedContent.questions.length,
        categories: parsedContent.questions.reduce((acc: Record<string, number>, q: any) => {
          acc[q.category] = (acc[q.category] || 0) + 1;
          return acc;
        }, {})
      });
      
      if (aiQuestionsMatchIntent || aiQuestionsAddressMissingInfo) {
        console.log("Using AI-generated questions due to better prompt-based matching");
        
        // Remove duplicate or very similar questions
        const uniqueQuestions = new Map();
        parsedContent.questions.forEach(q => {
          const simplifiedText = simplifyQuestionText(q.text);
          if (!uniqueQuestions.has(simplifiedText)) {
            uniqueQuestions.set(simplifiedText, q);
          } else {
            // Keep the question with an answer if present
            const existingQuestion = uniqueQuestions.get(simplifiedText);
            if (!existingQuestion.answer && q.answer) {
              uniqueQuestions.set(simplifiedText, q);
            }
          }
        });
        
        questions = Array.from(uniqueQuestions.values());
        console.log(`Using ${questions.length} AI questions after deduplication`);
      } else {
        console.log("Using locally generated questions for better prompt-based coverage");
        // Keep our locally generated questions but enhance with any pre-filled answers
        const aiAnswers = new Map(parsedContent.questions.filter(q => q.answer).map(q => [simplifyQuestionText(q.text), q.answer]));
        
        // Try to apply any pre-filled answers from AI to our local questions
        questions = questions.map(q => {
          const simplifiedText = simplifyQuestionText(q.text);
          const aiAnswer = aiAnswers.get(simplifiedText);
          if (!q.answer && aiAnswer) {
            q.answer = aiAnswer;
          }
          return q;
        });
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

    // If we have AI-generated variables that seem to address the prompt, consider using them
    if (Array.isArray(parsedContent?.variables) && parsedContent.variables.length > 0) {
      const aiVariablesMatchPrompt = parsedContent.variables.some(v => 
        userIntent.split(' ').some(word => 
          v.name.toLowerCase().includes(word.toLowerCase()) || 
          (v.value && v.value.toLowerCase().includes(word.toLowerCase()))
        )
      );
      
      if (aiVariablesMatchPrompt) {
        console.log("Using AI-generated variables due to better prompt matching");
        variables = parsedContent.variables;
      }
    }

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
      missingInfoCategories,
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
          missingInfoCategories,
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

// Function to identify missing information categories in a prompt
function identifyMissingInformation(promptText: string): string[] {
  const missingCategories = [];
  const promptLower = promptText.toLowerCase();
  
  // Check for missing details about objects
  const objects = extractObjectsFromPrompt(promptText);
  objects.forEach(obj => {
    // Check for color information
    if (!promptLower.includes(`${obj.toLowerCase()} color`) && 
        !promptLower.includes(`color of the ${obj.toLowerCase()}`) &&
        !promptLower.includes(`red ${obj.toLowerCase()}`) &&
        !promptLower.includes(`blue ${obj.toLowerCase()}`) &&
        !promptLower.includes(`green ${obj.toLowerCase()}`) &&
        !promptLower.includes(`yellow ${obj.toLowerCase()}`) &&
        !promptLower.includes(`black ${obj.toLowerCase()}`) &&
        !promptLower.includes(`white ${obj.toLowerCase()}`) &&
        !promptLower.includes(`brown ${obj.toLowerCase()}`) &&
        !promptLower.includes(`purple ${obj.toLowerCase()}`) &&
        !promptLower.includes(`orange ${obj.toLowerCase()}`) &&
        !promptLower.includes(`pink ${obj.toLowerCase()}`)) {
      missingCategories.push(`${obj} color`);
    }
    
    // Check for size information
    if (!promptLower.includes(`${obj.toLowerCase()} size`) && 
        !promptLower.includes(`size of the ${obj.toLowerCase()}`) &&
        !promptLower.includes(`big ${obj.toLowerCase()}`) &&
        !promptLower.includes(`small ${obj.toLowerCase()}`) &&
        !promptLower.includes(`large ${obj.toLowerCase()}`) &&
        !promptLower.includes(`tiny ${obj.toLowerCase()}`)) {
      missingCategories.push(`${obj} size`);
    }
    
    // Check for specific type/breed (for animals)
    if ((obj.toLowerCase() === 'dog' || obj.toLowerCase() === 'cat') &&
        !promptLower.includes('breed') &&
        !promptLower.includes('labrador') &&
        !promptLower.includes('poodle') &&
        !promptLower.includes('retriever') &&
        !promptLower.includes('shepherd') &&
        !promptLower.includes('terrier') &&
        !promptLower.includes('bulldog') &&
        !promptLower.includes('siamese') &&
        !promptLower.includes('persian')) {
      missingCategories.push(`${obj} breed`);
    }
  });
  
  // Check for missing background/setting
  if (!promptLower.includes('background') && 
      !promptLower.includes('setting') && 
      !promptLower.includes('environment') &&
      !promptLower.includes('scene')) {
    missingCategories.push('background');
  }
  
  // Check for missing time of day
  if (!promptLower.includes('day') && 
      !promptLower.includes('night') && 
      !promptLower.includes('morning') &&
      !promptLower.includes('evening') &&
      !promptLower.includes('afternoon')) {
    missingCategories.push('time of day');
  }
  
  // Check for missing action specifics
  if ((promptLower.includes('playing') || 
       promptLower.includes('running') || 
       promptLower.includes('jumping') ||
       promptLower.includes('doing')) &&
      !promptLower.includes('how')) {
    missingCategories.push('action details');
  }
  
  return missingCategories;
}

function extractObjectsFromPrompt(promptText: string): string[] {
  const commonObjects = ['dog', 'cat', 'person', 'man', 'woman', 'child', 'house', 'car', 'ball', 'tree', 'flower'];
  const words = promptText.toLowerCase().split(/\s+/);
  
  return commonObjects.filter(obj => words.includes(obj));
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

// Helper function to simplify question text for comparison
function simplifyQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // Remove examples in parentheses
    .replace(/[^\w\s]/g, '')   // Remove punctuation
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
}
