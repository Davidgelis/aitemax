
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
        inputTypes,
        uploadedImagesCount: uploadedImages?.length || 0
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
  
  const enhancePromptWithGPT = async (
    originalPrompt: string,
    primaryToggle: string | null,
    secondaryToggle: string | null,
    setFinalPrompt: (text: string) => void,
    answeredQuestions: Question[] = [],
    relevantVariables: Variable[] = [],
    selectedTemplate: any = null
  ) => {
    try {
      setCurrentLoadingMessage(`Enhancing prompt${primaryToggle ? ` for ${primaryToggle}` : ''}...`);
      
      // Enhanced logging for template usage
      console.log("usePromptAnalysis: Enhancing prompt with template:", 
        selectedTemplate ? {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          pillars: selectedTemplate.pillars?.map((p: any) => p.title) || [],
          characterLimit: selectedTemplate.characterLimit || "default",
          temperature: selectedTemplate.temperature || "default"
        } : "No template");
      
      // Make a clean copy of the template to avoid reference issues
      const templateCopy = selectedTemplate ? JSON.parse(JSON.stringify(selectedTemplate)) : null;
      
      // Call the Supabase edge function with all necessary data
      const { data, error } = await supabase.functions.invoke("enhance-prompt", {
        body: { 
          originalPrompt, 
          answeredQuestions,  // Pass the answered questions
          relevantVariables,  // Pass the relevant variables
          primaryToggle,
          secondaryToggle,
          userId: user?.id || null,
          promptId: currentPromptId,
          template: templateCopy  // Pass the template copy to the edge function
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
