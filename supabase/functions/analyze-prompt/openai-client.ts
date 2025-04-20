
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

export async function analyzePromptWithAI(
  promptText: string, 
  systemMessage: string, 
  apiKey: string,
  smartContext: string = "",
  imageBase64?: string
): Promise<any> {
  if (!promptText || typeof promptText !== 'string') {
    console.error("Invalid prompt text:", promptText);
    throw new Error("Invalid prompt text provided");
  }

  if (!apiKey) {
    console.error("Missing API key");
    throw new Error("OpenAI API key is required");
  }

  // Initialize structured context object
  let structuredContext = {
    imageAnalysis: null,
    smartContext: null,
    promptText
  };
  
  // Process image if available with enhanced error handling and validation
  if (imageBase64) {
    console.log("Starting image analysis with GPT-4.1...");
    try {
      // Validate base64 string
      if (!imageBase64.match(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/)) {
        console.warn("Invalid base64 format, attempting to clean up...");
        // Try to clean up the base64 string by removing potential data URL prefix
        if (imageBase64.includes(',')) {
          imageBase64 = imageBase64.split(',')[1];
          console.log("Extracted base64 content after comma");
        }
      }
      
      const imageAnalysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1', // Using gpt-4.1 as required
          messages: [
            {
              role: 'system',
              content: `Analyze this image and extract detailed structured information in JSON format. Include:
              - description: Comprehensive description of the image
              - subjects: Main subjects/elements with detailed attributes
              - style: Visual style characteristics, colors, composition
              - technical: Resolution, quality, lighting, perspective
              - context: Mood, setting, intended purpose
              - potential_use: Suggested applications or uses
              Return ONLY valid JSON with these exact fields.`
            },
            {
              role: 'user',
              content: [
                {
                  type: "text",
                  text: "Analyze this image in detail:"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!imageAnalysisResponse.ok) {
        const errorText = await imageAnalysisResponse.text();
        console.error(`Image analysis failed with status: ${imageAnalysisResponse.status}`, errorText);
        throw new Error(`Image analysis failed with status: ${imageAnalysisResponse.status}`);
      }

      const analysisData = await imageAnalysisResponse.json();
      console.log("Raw image analysis response received, status:", analysisData.choices ? "Success" : "Failed");
      
      if (analysisData.choices?.[0]?.message?.content) {
        try {
          const parsedContent = JSON.parse(analysisData.choices[0].message.content);
          console.log("Structured image analysis:", {
            description: parsedContent.description?.substring(0, 100) + "...",
            hasSubjects: !!parsedContent.subjects,
            hasStyle: !!parsedContent.style,
            hasTechnical: !!parsedContent.technical,
          });
          
          // Validate the parsed content has all required fields
          const requiredFields = ['description', 'subjects', 'style', 'technical', 'context', 'potential_use'];
          const missingFields = requiredFields.filter(field => !parsedContent[field]);
          
          if (missingFields.length > 0) {
            console.warn("Image analysis missing fields:", missingFields);
            // Add empty objects for missing fields to prevent errors
            missingFields.forEach(field => {
              parsedContent[field] = parsedContent[field] || {};
            });
          }
          
          structuredContext.imageAnalysis = parsedContent;
        } catch (parseError) {
          console.error("Failed to parse image analysis JSON:", parseError);
          throw new Error(`Invalid image analysis response format: ${parseError.message}`);
        }
      } else {
        console.error("No content in image analysis response");
        throw new Error("Empty response from image analysis");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      // Continue without image analysis rather than failing completely
      console.log("Will proceed without image analysis");
    }
  }

  // Process smart context with enhanced validation
  if (smartContext) {
    console.log("Processing smart context for enhanced analysis");
    try {
      const smartContextResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1', // Using gpt-4.1 as required
          messages: [
            {
              role: 'system',
              content: `Analyze the provided context and extract structured information in JSON format. Include:
              - key_points: Main points or requirements
              - technical_details: Any technical specifications
              - preferences: Style or format preferences
              - constraints: Any limitations or restrictions
              - metadata: Any other relevant contextual information
              Return ONLY valid JSON.`
            },
            {
              role: 'user',
              content: smartContext
            }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!smartContextResponse.ok) {
        const errorText = await smartContextResponse.text();
        console.error(`Smart context analysis failed with status: ${smartContextResponse.status}`, errorText);
        throw new Error(`Smart context analysis failed with status: ${smartContextResponse.status}`);
      }

      const smartData = await smartContextResponse.json();
      if (smartData.choices?.[0]?.message?.content) {
        try {
          structuredContext.smartContext = JSON.parse(smartData.choices[0].message.content);
          console.log("Structured smart context:", {
            hasKeyPoints: !!structuredContext.smartContext.key_points,
            hasTechnicalDetails: !!structuredContext.smartContext.technical_details,
            hasPreferences: !!structuredContext.smartContext.preferences,
          });
        } catch (parseError) {
          console.error("Failed to parse smart context JSON:", parseError);
          throw new Error(`Invalid smart context response format: ${parseError.message}`);
        }
      } else {
        console.error("No content in smart context response");
      }
    } catch (error) {
      console.error("Error processing smart context:", error);
      // Continue without smart context rather than failing completely
      console.log("Will proceed without smart context");
    }
  }

  // Build comprehensive context for better pre-filling
  const enhancedContext = {
    userInput: {
      prompt: promptText,
      timestamp: new Date().toISOString()
    },
    context: {
      image: structuredContext.imageAnalysis ? {
        analysis: structuredContext.imageAnalysis,
        type: "vision",
        source: "gpt-4.1"
      } : null,
      smart: structuredContext.smartContext ? {
        content: structuredContext.smartContext,
        type: "structured",
        source: "user-provided"
      } : null
    },
    metadata: {
      hasImageAnalysis: !!structuredContext.imageAnalysis,
      hasSmartContext: !!structuredContext.smartContext
    }
  };

  try {
    console.log("Sending final analysis request with context:", {
      hasImage: !!enhancedContext.context.image,
      hasSmartContext: !!enhancedContext.context.smart,
      promptLength: promptText.length
    });
    
    // Log detailed image context if available
    if (enhancedContext.context.image) {
      console.log("Image context summary for final analysis:", {
        description: enhancedContext.context.image.analysis.description.substring(0, 100) + "...",
        subjectsCount: Object.keys(enhancedContext.context.image.analysis.subjects || {}).length,
        styleAttributes: Object.keys(enhancedContext.context.image.analysis.style || {}).length
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1', // Using gpt-4.1 as required
        messages: [
          { 
            role: 'system', 
            content: systemMessage 
          },
          {
            role: 'user',
            content: JSON.stringify(enhancedContext)
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from OpenAI");
    }

    try {
      const parsedResponse = JSON.parse(data.choices[0].message.content);
      console.log("Successfully parsed response:", {
        questionsCount: parsedResponse.questions?.length || 0,
        preFilledCount: parsedResponse.questions?.filter((q: any) => q.answer?.startsWith("PRE-FILLED:")).length || 0,
        hasVariables: !!parsedResponse.variables,
        hasMasterCommand: !!parsedResponse.masterCommand,
        hasEnhancedPrompt: !!parsedResponse.enhancedPrompt
      });
      
      // Verify image-based pre-filled answers have proper attribution
      if (enhancedContext.context.image && parsedResponse.questions) {
        const imagePreFilledQuestions = parsedResponse.questions.filter((q: any) => 
          q.answer?.startsWith("PRE-FILLED:") && q.contextSource === "image"
        );
        
        console.log(`Found ${imagePreFilledQuestions.length} questions pre-filled from image analysis`);
        
        // Make sure all image-based pre-fills have proper attribution
        parsedResponse.questions = parsedResponse.questions.map((q: any) => {
          if (q.answer?.startsWith("PRE-FILLED:") && q.contextSource === "image" && !q.answer.includes("(from image analysis)")) {
            q.answer = `${q.answer} (from image analysis)`;
          }
          return q;
        });
      }
      
      return {
        content: JSON.stringify(parsedResponse),
        usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
