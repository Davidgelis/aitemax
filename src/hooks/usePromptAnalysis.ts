
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable } from "@/components/dashboard/types";

export const usePromptAnalysis = (
  promptText: string,
  setQuestions: (questions: Question[]) => void,
  setVariables: (variables: Variable[]) => void,
  setMasterCommand: (command: string) => void,
  setFinalPrompt: (prompt: string) => void,
  setCurrentStep: (step: number) => void,
  selectedPrimary: string | null,
  selectedSecondary: string | null,
  user: any,
  currentPromptId: string | null
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState("");

  const handleAnalyze = async (
    uploadedImages: any[] | null = null,
    websiteContext: { url: string; instructions: string } | null = null,
    smartContext: { context: string; usageInstructions: string } | null = null
  ) => {
    setIsLoading(true);
    setCurrentLoadingMessage("Analyzing your prompt...");

    try {
      // Add more robust input validation
      const inputTypes = {
        hasText: !!promptText,
        hasToggles: !!(selectedPrimary || selectedSecondary),
        hasWebscan: !!(websiteContext && websiteContext.url),
        hasImageScan: !!(uploadedImages && Array.isArray(uploadedImages) && uploadedImages.length > 0),
        hasSmartContext: !!(smartContext && smartContext.context)
      };

      console.log("Analyze inputs:", { 
        promptText: promptText ? `${promptText.substring(0, 50)}...` : "empty", 
        hasImages: !!uploadedImages && Array.isArray(uploadedImages) && uploadedImages.length > 0,
        hasWebsiteContext: !!websiteContext && !!websiteContext.url,
        hasSmartContext: !!smartContext && !!smartContext.context,
        inputTypes
      });

      const { data, error } = await supabase.functions.invoke("analyze-prompt", {
        body: {
          promptText,
          primaryToggle: selectedPrimary,
          secondaryToggle: selectedSecondary,
          userId: user?.id || null,
          promptId: currentPromptId,
          websiteData: websiteContext || null,
          imageData: uploadedImages && Array.isArray(uploadedImages) && uploadedImages.length > 0 ? uploadedImages : null,
          smartContextData: smartContext || null,
          inputTypes
        },
      });

      if (error) {
        console.error("Error analyzing prompt:", error);
        setCurrentLoadingMessage(`Error: ${error.message}`);
        return;
      }

      if (data.error) {
        console.error("API error:", data.error);
        setCurrentLoadingMessage(`API Error: ${data.error}`);
        return;
      }

      if (data) {
        console.log("Analysis result:", data);
        setQuestions(data.questions || []);
        setVariables(data.variables || []);
        setMasterCommand(data.masterCommand || "");
        setFinalPrompt(data.enhancedPrompt || "");
        setCurrentStep(2);
      } else {
        console.warn("No data returned from analysis");
        setCurrentLoadingMessage("No data received from analysis.");
      }
    } catch (err) {
      console.error("Error in handleAnalyze:", err);
      setCurrentLoadingMessage(`An unexpected error occurred: ${err}`);
    } finally {
      setIsLoading(false);
      setCurrentLoadingMessage("");
    }
  };
  
  // We're not using this function directly anymore from StepController
  // It's kept for API compatibility but now should filter data properly
  const enhancePromptWithGPT = async (
    originalPrompt: string,
    primaryToggle: string | null,
    secondaryToggle: string | null,
    setFinalPrompt: (text: string) => void
  ) => {
    try {
      setCurrentLoadingMessage(`Enhancing prompt${primaryToggle ? ` for ${primaryToggle}` : ''}...`);
      
      // Get selected template from the window object (added in StepOne.tsx)
      // @ts-ignore
      const selectedTemplate = window.__selectedTemplate || null;
      
      console.log("Legacy enhancePromptWithGPT called with:", {
        originalPrompt: originalPrompt.substring(0, 50) + "...",
        primaryToggle,
        secondaryToggle,
        template: selectedTemplate?.name || "none"
      });
      
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke("enhance-prompt", {
        body: { 
          originalPrompt, 
          answeredQuestions: [], // This is intentionally empty as we're not using this function directly
          relevantVariables: [], // This is intentionally empty as we're not using this function directly
          primaryToggle,
          secondaryToggle,
          userId: user?.id || null,
          promptId: currentPromptId,
          template: selectedTemplate  // Pass the template to the edge function
        }
      });
      
      if (error) {
        console.error("Error enhancing prompt:", error);
        setFinalPrompt(originalPrompt);
        return;
      }
      
      if (data.error) {
        console.error("API error:", data.error);
        setFinalPrompt(originalPrompt);
        return;
      }
      
      if (data.enhancedPrompt) {
        console.log("Enhanced prompt:", data.enhancedPrompt.substring(0, 100) + "...");
        setFinalPrompt(data.enhancedPrompt);
      } else {
        console.warn("No enhanced prompt returned");
        setFinalPrompt(originalPrompt);
      }
    } catch (err) {
      console.error("Error in enhancePromptWithGPT:", err);
      setFinalPrompt(originalPrompt);
    } finally {
      setCurrentLoadingMessage("");
    }
  };

  return {
    isLoading,
    currentLoadingMessage,
    handleAnalyze,
    enhancePromptWithGPT
  };
};
