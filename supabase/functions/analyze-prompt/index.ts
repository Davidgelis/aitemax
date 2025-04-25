
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSystemPrompt } from './system-prompt.ts';
import { extractQuestions, extractVariables, extractMasterCommand, extractEnhancedPrompt } from './utils/extractors.ts';
import { generateContextQuestionsForPrompt, generateContextualVariablesForPrompt } from './utils/generators.ts';
import { analyzePromptWithAI } from './openai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Starting analyze-prompt function with enhanced context-aware question generation");
    
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

    // Enhanced image data validation - stricter validation to prevent false positives
    let hasValidImageData = false;
    if (Array.isArray(imageData) && imageData.length > 0) {
      // Check that we have valid base64 data (not just an empty string)
      hasValidImageData = imageData.some(img => 
        img && 
        img.base64 && 
        img.base64.length > 100 && // Real image data should be longer than this
        img.context
      );
      
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
    
    // Only process image data if it's actually valid
    if (hasValidImageData) {
      console.log("Processing valid image data with intent-based validation");
      
      try {
        // Only proceed with first valid image that has both base64 and context
        const validImage = imageData.find(img => 
          img && 
          img.base64 && 
          img.base64.length > 100 && 
          img.context
        );
        
        if (validImage) {
          imageBase64 = validImage.base64.replace(/^data:image\/[a-z]+;base64,/, '');
          imageContext = validImage.context || '';
          enhancedContext = `${enhancedContext}\n\nIMAGE CONTEXT: ${imageContext}`;
          console.log("Successfully processed image data:", {
            hasBase64: !!imageBase64,
            base64Length: imageBase64 ? imageBase64.length : 0,
            hasContext: !!imageContext,
            contextLength: imageContext.length,
            intentFromContext: extractUserIntent(imageContext)
          });
        } else {
          console.log("No valid image found after detailed validation");
          imageBase64 = null;
          imageContext = '';
          hasValidImageData = false;
        }
      } catch (imageErr) {
        console.error("Error processing image:", imageErr);
        imageBase64 = null;
        imageContext = '';
        hasValidImageData = false;
      }
    } else {
      console.log("No valid image data to process, skipping image analysis");
      imageBase64 = null;
      imageContext = '';
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

    console.log("Calling OpenAI API for intent-based analysis", {
      hasImageData: hasValidImageData,
      imageProcessingStatus: hasValidImageData ? "sending image to API" : "no image to process",
      contextLength: enhancedContext.length
    });
    
    // Only pass image to OpenAI if we have valid image data
    const { content } = await analyzePromptWithAI(
      enhancedContext,
      systemPrompt,
      apiKey,
      smartContextData?.context || '',
      hasValidImageData ? imageBase64 : null, // Only pass image if valid
      model
    );

    console.log("Received response from OpenAI, parsing content");

    let parsedContent;
    let imageAnalysis = null;
    
    try {
      parsedContent = JSON.parse(content);
      imageAnalysis = parsedContent.imageAnalysis;
      
      // Ensure parsedContent.questions is always an array - Fix for the filter error
      if (!Array.isArray(parsedContent.questions)) {
        console.log("parsedContent.questions is not an array, setting to empty array");
        parsedContent.questions = [];
      }
      
      // Process image analysis to ensure each item becomes a separate question
      if (imageAnalysis && typeof imageAnalysis === 'object' && hasValidImageData) {
        // New array to store extracted questions
        const extractedQuestions = [];
        
        // Process each field in the image analysis
        Object.keys(imageAnalysis).forEach(key => {
          if (typeof imageAnalysis[key] === 'string') {
            // Look for numbered questions pattern like "0: Question?"
            const numberedQuestions = extractNumberedQuestions(imageAnalysis[key]);
            if (numberedQuestions.length > 0) {
              console.log(`Found ${numberedQuestions.length} numbered questions in imageAnalysis.${key}`);
              
              // Add each extracted question to our list
              numberedQuestions.forEach(questionText => {
                if (questionText) {
                  extractedQuestions.push({
                    text: questionText,
                    category: key,
                    contextSource: 'image'
                  });
                }
              });
              
              // Clean up the original field
              imageAnalysis[key] = imageAnalysis[key].split(/\d+\s*:/).shift() || ''; 
            }
            
            // Also look for numbered list format like "1. Question?"
            const numberedListQuestions = extractNumberedListQuestions(imageAnalysis[key]);
            if (numberedListQuestions.length > 0) {
              console.log(`Found ${numberedListQuestions.length} numbered list questions in imageAnalysis.${key}`);
              numberedListQuestions.forEach(questionText => {
                if (questionText) {
                  extractedQuestions.push({
                    text: questionText,
                    category: key,
                    contextSource: 'image'
                  });
                }
              });
              
              // Clean up the original field
              imageAnalysis[key] = imageAnalysis[key].replace(/\d+\.\s+[^.?!]*\?/g, '').trim();
            }
          } else if (typeof imageAnalysis[key] === 'object' && imageAnalysis[key] !== null) {
            // Handle nested objects in image analysis
            Object.keys(imageAnalysis[key]).forEach(nestedKey => {
              if (typeof imageAnalysis[key][nestedKey] === 'string') {
                const numberedQuestions = extractNumberedQuestions(imageAnalysis[key][nestedKey]);
                const numberedListQuestions = extractNumberedListQuestions(imageAnalysis[key][nestedKey]);
                
                // Process both types of numbered formats
                [...numberedQuestions, ...numberedListQuestions].forEach(questionText => {
                  if (questionText) {
                    extractedQuestions.push({
                      text: questionText,
                      category: key,
                      contextSource: 'image'
                    });
                  }
                });
                
                // Clean up the original field
                imageAnalysis[key][nestedKey] = imageAnalysis[key][nestedKey]
                  .replace(/\d+\s*:\s*[^0-9:]*(?=\d+\s*:|$)/g, '')
                  .replace(/\d+\.\s+[^.?!]*\?/g, '')
                  .trim();
              }
            });
          }
        });
        
        console.log(`Extracted ${extractedQuestions.length} questions from image analysis`);
        
        // Add the extracted questions to the parsedContent.questions array
        if (extractedQuestions.length > 0) {
          if (!Array.isArray(parsedContent.questions)) {
            parsedContent.questions = [];
          }
          
          // Convert the extracted questions to the proper format and add them
          extractedQuestions.forEach((question, index) => {
            // Remove any prefixes like "Based on image analysis:" from question text
            let cleanQuestionText = question.text;
            cleanQuestionText = cleanQuestionText
              .replace(/^based on image analysis:\s*/i, '')
              .replace(/^questions?:\s*/i, '')
              .trim();
              
            parsedContent.questions.push({
              id: `q-img-${index + 1}`,
              text: cleanQuestionText,
              category: question.category,
              answer: "",
              isRelevant: true,
              contextSource: 'image'
            });
          });
          
          console.log(`Added ${extractedQuestions.length} extracted questions to parsedContent.questions`);
        }
      }
      
      console.log("Successfully parsed JSON response", {
        hasImageAnalysis: !!imageAnalysis,
        imageAnalysisPillars: imageAnalysis ? Object.keys(imageAnalysis).join(", ") : "none",
        questionsCount: parsedContent.questions ? parsedContent.questions.length : 0,
        prefilledQuestionsCount: parsedContent.questions ? parsedContent.questions.filter(q => q.answer).length : 0
      });
      
      // Clean up all questions to remove any "Based on image analysis:" prefixes
      // and any remaining numbered sub-questions that might have slipped through
      if (Array.isArray(parsedContent.questions)) {
        parsedContent.questions = parsedContent.questions.map(q => {
          if (q.text) {
            q.text = q.text
              .replace(/^based on image analysis:\s*/i, '')
              .replace(/^questions?:\s*/i, '')
              .replace(/^\d+\s*:\s*/, '')
              .replace(/^\d+\.\s+/, '')
              .trim();
          }
          
          if (q.answer) {
            q.answer = q.answer
              .replace(/^based on image analysis:\s*/i, '')
              .replace(/^questions?:\s*/i, '')
              .trim();
              
            // If answer contains numbered sub-questions, extract just first response
            if (q.answer.match(/\d+\s*:/) || q.answer.match(/\d+\.\s+[^.?!]*\?/)) {
              q.answer = q.answer.split(/\d+\s*:|\d+\.\s+/)[0].trim();
            }
          }
          
          return q;
        });
      }
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

    // Generate questions using our enhanced context-aware generator - no strict filtering constraints
    let questions = generateContextQuestionsForPrompt(
      enhancedContext,
      template,
      smartContextData,
      imageAnalysis,
      userIntent
    );
    
    console.log(`Generated ${questions.length} intent-based questions (${questions.filter(q => q.answer).length} with pre-filled answers)`);

    // If we have AI-generated questions, check if they're valuable additions
    const aiGeneratedQuestions = Array.isArray(parsedContent?.questions) ? 
                              parsedContent.questions : [];
    
    // Check AI-generated question quality
    if (aiGeneratedQuestions.length > 0) {
      console.log(`Evaluating ${aiGeneratedQuestions.length} AI-generated questions`);
      
      // Find meaningful AI questions that add value
      const uniqueAIQuestions = aiGeneratedQuestions.filter(aiQ => {
        // Check if this question adds unique value
        return !questions.some(q => isSimilarQuestion(q.text, aiQ.text)) &&
               isRelevantToPrompt(aiQ.text, promptText, userIntent);
      });
      
      if (uniqueAIQuestions.length > 0) {
        console.log(`Adding ${uniqueAIQuestions.length} unique AI-generated questions`);
        
        // Add the unique AI questions to our list
        questions = [
          ...questions,
          ...uniqueAIQuestions.map(q => ({
            ...q,
            isRelevant: true
          }))
        ];
      }
    }
    
    // Always ensure we have at least 5 questions
    if (questions.length < 5) {
      console.log(`Only ${questions.length} questions generated, adding additional questions`);
      
      // Generate additional questions based on prompt keywords
      const promptKeywords = extractKeywords(promptText);
      const additionalQuestions = generateAdditionalQuestionsFromKeywords(promptKeywords, promptText);
      
      // Add any new unique questions
      additionalQuestions.forEach(newQ => {
        if (!questions.some(q => isSimilarQuestion(q.text, newQ.text))) {
          questions.push({
            id: `q-additional-${questions.length + 1}`,
            text: newQ.text,
            answer: newQ.examples ? `E.g: ${newQ.examples.join(', ')}` : '',
            isRelevant: true,
            category: newQ.category || 'Additional Context',
            contextSource: 'prompt'
          });
        }
      });
      
      console.log(`Added ${additionalQuestions.length} additional questions, now have ${questions.length} total`);
    }
    
    // Generate variables with appropriate detail level
    let variables = generateContextualVariablesForPrompt(
      enhancedContext,
      template,
      imageAnalysis,
      smartContextData,
      false // Never use concise variables to ensure comprehensive capture
    );

    const masterCommand = extractMasterCommand(content);
    const enhancedPrompt = extractEnhancedPrompt(content);

    // Log prefilled questions by category to help with debugging
    const categoryCounts = questions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("Analysis complete, returning results:", {
      questionsCount: questions.length,
      variablesCount: variables.length,
      prefilled: questions.filter(q => q.answer).length,
      categories: Object.keys(categoryCounts),
      categoryDistribution: categoryCounts,
      hasMasterCommand: !!masterCommand,
      hasEnhancedPrompt: !!enhancedPrompt,
      isPromptSimple,
      hasValidImageData,
      imageAnalysisAvailable: !!imageAnalysis,
      originalIntent: userIntent
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
          categories: Object.keys(categoryCounts),
          categoryDistribution: categoryCounts
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
  
  // Try to extract an action + object pattern with more context
  const actionObjectPattern = /(?:create|generate|make|design|draw|produce)\s+(?:a|an|the)?\s*([a-z\s]+(?:[a-z\s,]+)?)/i;
  const match = promptText.match(actionObjectPattern);
  
  if (match && match[1]) {
    // Return more words to capture the full intent and any key objects
    return match[1].trim().split(/\s+/).slice(0, 15).join(' ');
  }
  
  // Try to extract queries starting with "how to" or "what is"
  const queryPattern = /(?:how to|what is|how can i|where can i)\s+([a-z\s]+(?:[a-z\s,]+)?)/i;
  const queryMatch = promptText.match(queryPattern);
  
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1].trim().split(/\s+/).slice(0, 15).join(' ');
  }
  
  // Fallback: return more words to ensure we capture the full intent
  return promptText.split(/\s+/).slice(0, 12).join(' ').toLowerCase();
}

// Extract numbered questions in format "0: Question? 1: Another question?"
function extractNumberedQuestions(text: string): string[] {
  if (!text) return [];
  
  const questions = [];
  const regex = /\d+\s*:\s*([^\d:?]*\?)/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && match[1].trim()) {
      questions.push(match[1].trim());
    }
  }
  
  return questions;
}

// Extract numbered list questions in format "1. Question? 2. Another question?"
function extractNumberedListQuestions(text: string): string[] {
  if (!text) return [];
  
  const questions = [];
  const regex = /\d+\.\s+([^.?!]*\?)/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && match[1].trim()) {
      questions.push(match[1].trim());
    }
  }
  
  return questions;
}

// Check if a question is relevant to the prompt and user intent
function isRelevantToPrompt(question: string, promptText: string, userIntent: string): boolean {
  if (!question) return false;
  
  // Extract meaningful keywords from prompt
  const promptKeywords = extractKeywords(promptText);
  
  // Check if any keywords appear in the question
  const hasKeywords = promptKeywords.some(keyword => 
    question.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Check if the question is related to the user's intent
  const isIntentRelevant = userIntent && 
    question.toLowerCase().includes(userIntent.substring(0, Math.min(10, userIntent.length)).toLowerCase());
  
  // Accept the question if it matches keywords or intent
  return hasKeywords || isIntentRelevant;
}

// Check if two questions are similar to avoid duplication
function isSimilarQuestion(q1: string, q2: string): boolean {
  // Normalize both strings for comparison
  const normalize = (str: string) => str.toLowerCase()
    .replace(/[^\w\s?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const norm1 = normalize(q1);
  const norm2 = normalize(q2);
  
  // Check for high similarity
  if (norm1 === norm2) return true;
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Extract key phrases from both questions
  const keyPhrases1 = extractKeyPhrases(norm1);
  const keyPhrases2 = extractKeyPhrases(norm2);
  
  // Check for significant overlap in key phrases
  const commonPhrases = keyPhrases1.filter(phrase => 
    keyPhrases2.some(p => p === phrase || p.includes(phrase) || phrase.includes(p))
  );
  
  const similarityScore = commonPhrases.length / Math.max(keyPhrases1.length, keyPhrases2.length, 1);
  return similarityScore > 0.6; // 60% similarity threshold
}

// Extract key phrases from text
function extractKeyPhrases(text: string): string[] {
  const phrases = [];
  
  // Split by common phrase delimiters
  const parts = text.split(/[,;]|\s+(?:and|or|but|with|for|in|on|at|by|about)\s+/);
  
  // Add non-empty phrases
  parts.forEach(part => {
    const cleaned = part.trim();
    if (cleaned.length > 3) phrases.push(cleaned);
  });
  
  return phrases;
}

// Extract meaningful keywords from text
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Common words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'to', 'at', 'in', 'on', 'for', 'with', 'by',
    'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'
  ]);
  
  // Extract words, filtering out stop words and short words
  const keywords = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  return [...new Set(keywords)]; // Remove duplicates
}

// Generate additional questions based on keywords in the prompt
function generateAdditionalQuestionsFromKeywords(keywords: string[], promptText: string): any[] {
  const questions = [];
  
  // Add image-specific questions if relevant
  if (keywords.some(k => ['image', 'picture', 'photo', 'graphic', 'drawing', 'illustration'].includes(k))) {
    questions.push({
      text: "Do you have any specific aesthetic preferences for this image?",
      examples: ['minimalist', 'colorful', 'vintage', 'modern', 'abstract'],
      category: 'Style'
    });
    
    questions.push({
      text: "What should be the focal point or main subject of the image?",
      examples: ['a person', 'a landscape', 'a product', 'an abstract concept'],
      category: 'Content'
    });
  }
  
  // Add writing-specific questions if relevant
  if (keywords.some(k => ['text', 'write', 'writing', 'article', 'blog', 'content', 'essay'].includes(k))) {
    questions.push({
      text: "What tone should the content have?",
      examples: ['formal', 'casual', 'technical', 'conversational', 'persuasive'],
      category: 'Tone'
    });
    
    questions.push({
      text: "How long should the content be?",
      examples: ['short paragraph', 'few paragraphs', 'detailed article', 'comprehensive guide'],
      category: 'Length'
    });
    
    questions.push({
      text: "Who is the target audience for this content?",
      examples: ['general public', 'experts', 'beginners', 'customers', 'internal team'],
      category: 'Audience'
    });
  }
  
  // Always add some generally applicable questions
  questions.push({
    text: "What specific details are most important to include?",
    examples: ['technical specifications', 'emotional elements', 'historical context', 'practical examples'],
    category: 'Details'
  });
  
  questions.push({
    text: "How would you describe the overall style you're looking for?",
    examples: ['professional', 'creative', 'minimalist', 'detailed', 'innovative'],
    category: 'Style'
  });
  
  questions.push({
    text: "What's the primary purpose or goal you're trying to achieve?",
    examples: ['inform', 'persuade', 'entertain', 'instruct', 'inspire'],
    category: 'Purpose'
  });
  
  return questions;
}
