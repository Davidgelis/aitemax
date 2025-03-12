
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
  
  const { data, error } = await supabase.functions.invoke('analyze-prompt', {
    body: payload
  });
  
  if (error) throw error;
  
  return data;
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
    
    if (secondaryToggle) {
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
    secondaryToggle
  });
  
  const { data, error } = await supabase.functions.invoke('enhance-prompt', {
    body: {
      originalPrompt: promptToEnhance,
      answeredQuestions,
      relevantVariables,
      primaryToggle: selectedPrimary,
      secondaryToggle: selectedSecondary,
      userId: user?.id,
      promptId
    }
  });
  
  if (error) {
    console.error("Error enhancing prompt:", error);
    throw error;
  }
  
  console.log("Prompt enhanced successfully:", {
    loadingMessage: data.loadingMessage,
    usage: data.usage
  });
  
  return {
    enhancedPrompt: data.enhancedPrompt,
    loadingMessage: data.loadingMessage
  };
};
