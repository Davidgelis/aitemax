
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable, UploadedImage } from "@/components/dashboard/types";
import { imageToBase64 } from "@/utils/imageUtils";
import { primaryToggles, secondaryToggles } from "@/components/dashboard/constants";

export const createAnalysisPayload = async (
  promptText: string,
  selectedPrimary: string | null,
  selectedSecondary: string | null,
  images?: UploadedImage[],
  websiteData?: { url: string; instructions: string } | null,
  user?: any,
  promptId?: string | null
) => {
  // Include userId and promptId in the payload if available
  const payload: any = {
    promptText,
    primaryToggle: selectedPrimary,
    secondaryToggle: selectedSecondary
  };
  
  // Add user and prompt ID if available
  if (user) {
    payload.userId = user.id;
  }
  
  if (promptId) {
    payload.promptId = promptId;
  }
  
  // Add website data if available - ensure it's properly formatted
  if (websiteData && websiteData.url) {
    console.log("Including website data in analysis payload:", websiteData);
    payload.websiteData = {
      url: websiteData.url,
      instructions: websiteData.instructions || ""
    };
  }
  
  // Add image data if available
  if (images && images.length > 0) {
    const firstImage = images[0];
    try {
      console.log("Converting image to base64 for analysis:", firstImage.file.name);
      const base64 = await imageToBase64(firstImage.file);
      payload.imageData = { 
        base64,
        filename: firstImage.file.name,
        type: firstImage.file.type
      };
      console.log("Image successfully converted and added to payload");
    } catch (error) {
      console.error("Error converting image to base64:", error);
    }
  }
  
  return payload;
};

export const analyzePrompt = async (payload: any) => {
  console.log("Sending analysis request with toggles:", { 
    primaryToggle: payload.primaryToggle, 
    secondaryToggle: payload.secondaryToggle,
    hasImage: !!payload.imageData,
    hasWebsite: !!(payload.websiteData && payload.websiteData.url),
    hasAdditionalContext: !!(payload.imageData || (payload.websiteData && payload.websiteData.url)),
    websiteDataInPayload: !!payload.websiteData
  });
  
  try {
    // Setup timeout to handle long-running requests
    let timeoutId: any = null;
    
    // Create a promise wrapper that tracks the timeout
    const requestWithTimeout = new Promise<any>((resolve, reject) => {
      // Set a timeout to reject the promise after 60 seconds
      timeoutId = setTimeout(() => {
        reject(new Error('Analysis request timed out after 60 seconds'));
      }, 60000);
      
      // Call the edge function
      supabase.functions.invoke('analyze-prompt', {
        body: payload
      })
      .then(response => {
        clearTimeout(timeoutId);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.data);
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
    
    // Wait for the function to complete or timeout
    const data = await requestWithTimeout;
    return data;
  } catch (error) {
    console.error("Error invoking analyze-prompt function:", error);
    throw error;
  }
};

export const enhancePrompt = async (
  promptToEnhance: string,
  questions: Question[],
  variables: Variable[],
  selectedPrimary: string | null,
  selectedSecondary: string | null,
  user?: any,
  promptId?: string | null
) => {
  // Create a context-aware loading message based on toggles
  let message = "Enhancing your prompt";
  if (selectedPrimary) {
    const primaryLabel = primaryToggles.find(t => t.id === selectedPrimary)?.label || selectedPrimary;
    message += ` for ${primaryLabel}`;
    
    if (selectedSecondary) {
      const secondaryLabel = secondaryToggles.find(t => t.id === selectedSecondary)?.label || selectedSecondary;
      message += ` and to be ${secondaryLabel}`;
    }
  } else if (selectedSecondary) {
    const secondaryLabel = secondaryToggles.find(t => t.id === selectedSecondary)?.label || selectedSecondary;
    message += ` to be ${secondaryLabel}`;
  }
  message += "...";
  
  // Filter out only answered and relevant questions
  const answeredQuestions = questions.filter(
    q => q.answer && q.answer.trim() !== "" && q.isRelevant !== false
  );
  
  // Filter out only relevant variables
  const relevantVariables = variables.filter(
    v => v.isRelevant === true
  );
  
  // Log the data being sent to the enhance-prompt function
  console.log("Sending to enhance-prompt function:", {
    answeredQuestions: answeredQuestions.length,
    relevantVariables: relevantVariables.length,
    primaryToggle: selectedPrimary,
    secondaryToggle: selectedSecondary
  });
  
  try {
    // Setup timeout to handle long-running requests
    let timeoutId: any = null;
    
    // Create a promise wrapper that tracks the timeout
    const requestWithTimeout = new Promise<any>((resolve, reject) => {
      // Set a timeout to reject the promise after 60 seconds
      timeoutId = setTimeout(() => {
        reject(new Error('Enhance prompt request timed out after 60 seconds'));
      }, 60000);
      
      // Call the edge function
      supabase.functions.invoke('enhance-prompt', {
        body: {
          originalPrompt: promptToEnhance,
          answeredQuestions,
          relevantVariables,
          primaryToggle: selectedPrimary,
          secondaryToggle: selectedSecondary,
          userId: user?.id,
          promptId
        }
      })
      .then(response => {
        clearTimeout(timeoutId);
        if (response.error) {
          console.error("Error enhancing prompt:", response.error);
          reject(response.error);
        } else {
          console.log("Prompt enhanced successfully:", {
            loadingMessage: response.data.loadingMessage,
            usage: response.data.usage
          });
          
          resolve({
            enhancedPrompt: response.data.enhancedPrompt,
            loadingMessage: response.data.loadingMessage
          });
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
    
    // Wait for the function to complete or timeout
    const result = await requestWithTimeout;
    return result;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    throw error;
  }
};
