import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { analyzePromptWithAI } from "./openai-client.ts";
import { createSystemPrompt } from "./system-prompt.ts";
import { 
  extractQuestions, 
  extractVariables, 
  extractMasterCommand, 
  extractEnhancedPrompt 
} from "./utils/extractors.ts";
import { 
  generateContextQuestionsForPrompt,
  generateContextualVariablesForPrompt
} from "./utils/generators.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to calculate token costs
function calculateTokenCosts(promptTokens: number, completionTokens: number) {
  // GPT-4o pricing: $0.00250 per 1K prompt tokens, $0.00750 per 1K completion tokens
  const promptCost = (promptTokens / 1000) * 0.00250;
  const completionCost = (completionTokens / 1000) * 0.00750;
  return {
    promptCost,
    completionCost,
    totalCost: promptCost + completionCost
  };
}

// Helper function to record token usage in Supabase
async function recordTokenUsage(
  userId: string, 
  promptId: string | null,
  step: number,
  promptTokens: number, 
  completionTokens: number, 
  model: string
) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials missing, token usage will not be recorded");
    return;
  }

  const costs = calculateTokenCosts(promptTokens, completionTokens);
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/token_usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        prompt_id: promptId,
        step,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        prompt_cost: costs.promptCost,
        completion_cost: costs.completionCost,
        total_cost: costs.totalCost,
        model
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error recording token usage:", errorData);
    } else {
      console.log(`Token usage recorded successfully for user ${userId} at step ${step}`);
    }
  } catch (error) {
    console.error("Error recording token usage:", error);
  }
}

// Enhanced helper function to fetch content from a URL with better extraction
async function fetchWebsiteContent(url: string, userInstructions: string = "") {
  console.log(`Fetching content from website: ${url}`);
  console.log(`User instructions for extraction: ${userInstructions || "None provided"}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch website, status: ${response.status}`);
    }
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "Unknown Title";
    
    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1] : "";
    
    // Extract all relevant content with improved extraction
    let mainContent = "";
    
    // Better extraction for headings (h1-h6)
    const headingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);
    if (headingMatches) {
      const headings = headingMatches
        .map(h => h.replace(/<[^>]*>/g, '').trim())
        .filter(h => h.length > 0);
      mainContent += "HEADINGS:\n" + headings.join("\n") + "\n\n";
    }
    
    // Enhanced paragraph extraction
    const paragraphMatches = html.match(/<p[^>]*>(.*?)<\/p>/gi);
    if (paragraphMatches) {
      const paragraphs = paragraphMatches
        .map(p => p.replace(/<[^>]*>/g, '').trim())
        .filter(p => p.length > 5); // Ignore very short paragraphs
      mainContent += "PARAGRAPHS:\n" + paragraphs.join("\n\n") + "\n\n";
    }
    
    // Better list extraction (finds both ordered and unordered lists)
    const allListMatches = html.match(/<[ou]l[^>]*>(.*?)<\/[ou]l>/gis);
    if (allListMatches) {
      mainContent += "LISTS:\n";
      allListMatches.forEach(list => {
        const listItemMatches = list.match(/<li[^>]*>(.*?)<\/li>/gis);
        if (listItemMatches) {
          const items = listItemMatches
            .map(li => "• " + li.replace(/<[^>]*>/g, '').trim())
            .filter(li => li.length > 3);
          mainContent += items.join("\n") + "\n\n";
        }
      });
    }
    
    // Extract tables for structured data
    const tableMatches = html.match(/<table[^>]*>(.*?)<\/table>/gis);
    if (tableMatches) {
      mainContent += "TABLES:\n";
      tableMatches.forEach(table => {
        // Extract table rows
        const rowMatches = table.match(/<tr[^>]*>(.*?)<\/tr>/gis);
        if (rowMatches) {
          rowMatches.forEach(row => {
            // Extract table cells (both th and td)
            const cellMatches = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gis);
            if (cellMatches) {
              const cellContent = cellMatches
                .map(cell => cell.replace(/<[^>]*>/g, '').trim())
                .join(" | ");
              mainContent += cellContent + "\n";
            }
          });
          mainContent += "\n";
        }
      });
    }
    
    // Extract content from divs with common content class names
    const contentDivRegex = /<div[^>]*class=["'][^"']*(?:content|article|post|entry|main)[^"']*["'][^>]*>(.*?)<\/div>/gis;
    const contentDivMatches = html.match(contentDivRegex);
    if (contentDivMatches) {
      const extractedDivContent = contentDivMatches
        .map(div => {
          // Remove nested divs to avoid duplication
          let cleaned = div.replace(/<div[^>]*>.*?<\/div>/gis, ' ');
          // Remove all remaining HTML tags
          cleaned = cleaned.replace(/<[^>]*>/g, ' ');
          // Clean up whitespace
          cleaned = cleaned.replace(/\s+/g, ' ').trim();
          return cleaned;
        })
        .filter(content => content.length > 50); // Only keep substantial content
      
      if (extractedDivContent.length > 0) {
        mainContent += "CONTENT SECTIONS:\n" + extractedDivContent.join("\n\n") + "\n\n";
      }
    }
    
    // Special extraction for best practices, tips, guidelines based on user instructions
    if (userInstructions) {
      const instructionLower = userInstructions.toLowerCase();
      const keyTerms = [
        'best practice', 'tip', 'guide', 'how to', 'recommendation', 
        'step', 'instruction', 'procedure', 'method', 'technique'
      ];
      
      // Check if user is looking for any of these types of content
      const isLookingForStructuredContent = keyTerms.some(term => instructionLower.includes(term));
      
      if (isLookingForStructuredContent) {
        mainContent += "SPECIAL EXTRACTION (based on user instructions):\n";
        
        // Look for sections with these keywords in headings
        const specialHeadingRegex = new RegExp(`<h[1-6][^>]*>(.*?(${keyTerms.join('|')}).*?)<\/h[1-6]>`, 'gi');
        const specialHeadings = html.match(specialHeadingRegex);
        
        if (specialHeadings) {
          specialHeadings.forEach(heading => {
            const headingText = heading.replace(/<[^>]*>/g, '').trim();
            mainContent += `SECTION: ${headingText}\n`;
            
            // Find the content that follows this heading until the next heading
            const headingIndex = html.indexOf(heading) + heading.length;
            const nextHeadingMatch = html.slice(headingIndex).match(/<h[1-6][^>]*>/i);
            const endIndex = nextHeadingMatch 
              ? headingIndex + nextHeadingMatch.index 
              : Math.min(headingIndex + 5000, html.length); // Limit to 5000 chars if no next heading
            
            let sectionContent = html.slice(headingIndex, endIndex);
            
            // Extract paragraphs and list items from this section
            const sectionParagraphs = sectionContent.match(/<p[^>]*>(.*?)<\/p>/gi);
            if (sectionParagraphs) {
              sectionParagraphs.forEach(p => {
                const text = p.replace(/<[^>]*>/g, '').trim();
                if (text.length > 10) {
                  mainContent += `- ${text}\n`;
                }
              });
            }
            
            // Extract list items specifically
            const sectionListItems = sectionContent.match(/<li[^>]*>(.*?)<\/li>/gi);
            if (sectionListItems) {
              sectionListItems.forEach(li => {
                const text = li.replace(/<[^>]*>/g, '').trim();
                if (text.length > 5) {
                  mainContent += `• ${text}\n`;
                }
              });
            }
            
            mainContent += "\n";
          });
        }
      }
    }
    
    // If we couldn't extract structured content, fall back to removing all HTML tags
    if (!mainContent.trim()) {
      let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
      text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
      text = text.replace(/<[^>]*>?/gm, ' ');
      text = text.replace(/\s+/g, ' ').trim();
      mainContent = text;
    }
    
    // Ensure we're not sending too much content (limit to 20,000 chars)
    const limitedContent = mainContent.substring(0, 20000);
    
    return { 
      title, 
      text: limitedContent,
      metaDescription
    };
  } catch (error) {
    console.error(`Error fetching website content: ${error.message}`);
    return { title: "Error", text: `Failed to fetch website content: ${error.message}`, metaDescription: "" };
  }
}

// Helper function to extract relevant keywords and terms from text or image analysis
function extractKeyTerms(text: string): string[] {
  // Extract potential keywords (nouns, technical terms, etc.)
  const words = text.toLowerCase().split(/\s+/);
  
  // Filter common words and keep only potential keywords
  const commonWords = new Set(['a', 'an', 'the', 'is', 'are', 'and', 'or', 'for', 'to', 'in', 'on', 'with', 'by', 'at', 'from']);
  const keyTerms = words
    .filter(word => word.length > 3)  // Skip short words
    .filter(word => !commonWords.has(word))  // Skip common words
    .filter(word => /^[a-z]+$/.test(word));  // Keep only alphabetic words
  
  // Return unique terms, sorted by frequency
  const termCounts = {};
  keyTerms.forEach(term => {
    termCounts[term] = (termCounts[term] || 0) + 1;
  });
  
  return Object.keys(termCounts)
    .sort((a, b) => termCounts[b] - termCounts[a])
    .slice(0, 20);  // Return top 20 terms
}

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
      imageData 
    } = await req.json();
    
    console.log(`Analyzing prompt: "${promptText}"\n`);
    console.log(`Primary toggle: ${primaryToggle || "None"}`);
    console.log(`Secondary toggle: ${secondaryToggle || "None"}`);
    console.log(`Creating prompt for AI platform with appropriate context`);
    
    // Improved logging for debugging context data
    console.log("Website data provided:", websiteData ? "Yes" : "No");
    if (websiteData) {
      console.log(`Website URL: ${websiteData.url || "None"}`);
      console.log(`Website instructions: ${websiteData.instructions ? "Provided" : "None"}`);
    }
    
    console.log("Image data provided:", imageData ? "Yes" : "No");
    if (imageData) {
      console.log("Image type:", imageData.type || "No file type");
      console.log("Has image base64:", imageData.base64 ? "Yes" : "No");
      console.log("Image context provided:", imageData.context ? "Yes" : "No");
      if (imageData.context) {
        console.log("Image context:", imageData.context);
      }
    }
    
    // Add website content to context if provided
    let contextualData = "";
    let websiteKeywords = [];
    let hasAdditionalContext = false;
    
    if (websiteData && websiteData.url) {
      hasAdditionalContext = true;
      console.log(`Website provided for context: ${websiteData.url}`);
      console.log(`User instructions for website analysis: ${websiteData.instructions || "No specific instructions"}`);
      
      const websiteContent = await fetchWebsiteContent(websiteData.url, websiteData.instructions);
      websiteKeywords = extractKeyTerms(websiteContent.text);
      
      contextualData += `\n\nWEBSITE CONTEXT:
URL: ${websiteData.url}
Title: ${websiteContent.title}
Meta Description: ${websiteContent.metaDescription || "None"}
User Instructions: ${websiteData.instructions || "No specific instructions provided"}

Content Excerpt:
${websiteContent.text}

Key Terms: ${websiteKeywords.join(', ')}
      
YOUR TASK FOR WEBSITE ANALYSIS:
1. Analyze this website content thoroughly
2. Focus SPECIFICALLY on finding information related to: "${websiteData.instructions || "the main topic"}"
3. Extract concrete, detailed information from the website content
4. IMPORTANT: For question answers, provide 1-2 FULL SENTENCES of DETAILED information from the website
5. Include SPECIFIC FACTS, NUMBERS, QUOTES or EXAMPLES directly from the website when available
6. For questions about "best practices" or similar instructions, EXTRACT ALL relevant best practices from the content
7. For variables, keep values concise (5-10 words) but precise
8. Only use information EXPLICITLY present in the content - do not generalize or make assumptions`;
    }
    
    // Add image context if provided
    let imageContext = "";
    if (imageData && imageData.base64) {
      hasAdditionalContext = true;
      console.log("Image provided for context - will be sent to OpenAI for analysis");
      
      // Add specific instructions for image analysis if provided
      const specificInstructions = imageData.context 
        ? `\n\nSPECIFIC IMAGE ANALYSIS INSTRUCTIONS: ${imageData.context}\n\n` 
        : "";
      
      imageContext = `\n\nIMAGE CONTEXT: The user has provided an image. Please analyze this image thoroughly and extract all visual details including:
- Subject(s) in the image
- Viewpoint (looking up, eye-level, aerial view, etc.)
- Perspective (distance, angle, etc.)
- Setting/location/environment
- Time of day (if determinable)
- Season (if determinable)
- Weather conditions (if shown)
- Lighting conditions
- Color palette
- Mood/atmosphere
- Composition
- Style
- Textures
- Any other observable details${specificInstructions}

Extract these specific details and use them to pre-fill relevant answers to questions and values for variables. Only use information that is EXPLICITLY visible in the image.`;
    }
    
    console.log(`Additional context provided: ${hasAdditionalContext ? "Yes" : "No"}`);
    if (!hasAdditionalContext) {
      console.log("No additional context provided - ensuring answers and values remain empty");
      contextualData += "\n\nIMPORTANT: No additional context (website/image) has been provided. DO NOT pre-fill any answers or values - leave them ALL as empty strings.";
    }
    
    // Create a system message with better context about our purpose
    const systemMessage = createSystemPrompt(primaryToggle, secondaryToggle);
    
    // Get analysis from OpenAI
    const analysisResult = await analyzePromptWithAI(
      promptText, 
      systemMessage, 
      openAIApiKey, 
      contextualData + imageContext, 
      imageData?.base64
    );
    
    const analysis = analysisResult.content;
    
    // Record token usage for this step if userId is provided
    if (userId && analysisResult.usage) {
      await recordTokenUsage(
        userId,
        promptId,
        1, // Step 1: Initial prompt analysis
        analysisResult.usage.prompt_tokens,
        analysisResult.usage.completion_tokens,
        'gpt-4o'
      );
    }
    
    // Try to extract structured data from the analysis
    try {
      // Process the analysis to extract questions, variables, etc.
      const questions = extractQuestions(analysis, promptText);
      const variables = extractVariables(analysis, promptText);
      const masterCommand = extractMasterCommand(analysis);
      const enhancedPrompt = extractEnhancedPrompt(analysis);
      
      console.log(`Extracted ${questions.length} context questions relevant to AI platforms`);
      console.log(`Extracted ${variables.length} variables for customization`);
      
      // Log how many questions and variables were pre-filled
      const prefilledQuestions = questions.filter(q => q.answer && q.answer.trim() !== "").length;
      const prefilledVariables = variables.filter(v => v.value && v.value.trim() !== "").length;
      console.log(`Pre-filled answers: ${prefilledQuestions}/${questions.length} questions`);
      console.log(`Pre-filled values: ${prefilledVariables}/${variables.length} variables`);
      
      // If no additional context was provided, verify that no pre-filling occurred
      if (!hasAdditionalContext && (prefilledQuestions > 0 || prefilledVariables > 0)) {
        console.warn("WARNING: Pre-filled values detected without additional context. Clearing pre-filled values.");
        
        // Clear any pre-filled answers when no context was provided
        questions.forEach(q => { q.answer = ""; });
        variables.forEach(v => { v.value = ""; });
      }
      
      const result = {
        questions,
        variables,
        masterCommand,
        enhancedPrompt,
        rawAnalysis: analysis,
        usage: analysisResult.usage,
        primaryToggle,
        secondaryToggle,
        hasAdditionalContext  // Include flag in response
      };
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (extractionError) {
      console.error("Error extracting structured data from analysis:", extractionError);
      
      // Fallback to context-specific questions based on toggles
      let contextQuestions = generateContextQuestionsForPrompt(promptText);
      
      // If we have website data, add some pre-filled answers
      if (hasAdditionalContext && websiteData && websiteData.url && websiteKeywords.length > 0) {
        contextQuestions = contextQuestions.map(q => {
          // Try to pre-fill based on website context
          if (q.text.toLowerCase().includes("topic") || q.text.toLowerCase().includes("subject")) {
            return {...q, answer: `Based on the website, the main topic appears to be related to ${websiteKeywords.slice(0, 3).join(', ')}`};
          }
          if (q.text.toLowerCase().includes("tone") || q.text.toLowerCase().includes("style")) {
            return {...q, answer: "The tone should match the website's professional presentation"};
          }
          return q;
        });
      } else {
        // Ensure all answers are empty when no additional context is provided
        contextQuestions = contextQuestions.map(q => ({...q, answer: ""}));
      }
      
      // Filter out potentially irrelevant questions based on toggle type
      if (primaryToggle === "image") {
        contextQuestions = contextQuestions.filter(q => 
          !q.text.toLowerCase().includes("file format") && 
          !q.text.toLowerCase().includes("file type")
        );
      }
      
      let contextVariables = generateContextualVariablesForPrompt(promptText);
      
      // If we have website data, pre-fill some variables
      if (hasAdditionalContext && websiteData && websiteData.url && websiteKeywords.length > 0) {
        contextVariables = contextVariables.map(v => {
          // Try to pre-fill based on website keywords
          if (v.name.toLowerCase().includes("topic") || v.name.toLowerCase().includes("subject")) {
            return {...v, value: websiteKeywords.slice(0, 3).join(', ')};
          }
          if (v.name.toLowerCase().includes("keywords")) {
            return {...v, value: websiteKeywords.slice(0, 5).join(', ')};
          }
          return v;
        });
      } else {
        // Ensure all values are empty when no additional context is provided
        contextVariables = contextVariables.map(v => ({...v, value: ""}));
      }
      
      // Fallback to mock data but still return a 200 status code
      return new Response(JSON.stringify({
        questions: contextQuestions,
        variables: contextVariables,
        masterCommand: "Analyzed prompt: " + promptText.substring(0, 50) + "...",
        enhancedPrompt: "# Enhanced Prompt\n\n" + promptText,
        error: extractionError.message,
        rawAnalysis: analysis,
        usage: analysisResult.usage,
        primaryToggle,
        secondaryToggle,
        hasAdditionalContext  // Include flag in response
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Error in analyze-prompt function:", error);
    
    // Always return a 200 status code even on error, with error details in the response body
    return new Response(JSON.stringify({
      questions: generateContextQuestionsForPrompt("").map(q => ({...q, answer: ""})),
      variables: generateContextualVariablesForPrompt("").map(v => ({...v, value: ""})),
      masterCommand: "Error analyzing prompt",
      enhancedPrompt: "# Error\n\nThere was an error analyzing your prompt. Please try again.",
      error: error.message,
      primaryToggle: null,
      secondaryToggle: null,
      hasAdditionalContext: false
    }), {
      status: 200, // Always return a 200 to avoid edge function errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
