
import { useState } from "react";
import { Question, Variable, UploadedImage } from "@/components/dashboard/types";
import { mockQuestions } from "@/components/dashboard/constants";
import { useToast } from "@/hooks/use-toast";
import { useLoadingMessages } from "@/hooks/useLoadingMessages";
import { isValidVariableName } from "@/utils/imageUtils";
import { 
  createAnalysisPayload, 
  analyzePrompt, 
  enhancePrompt 
} from "@/services/promptAnalysisService";

export const usePromptAnalysis = (
  promptText: string,
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>,
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>,
  setMasterCommand: React.Dispatch<React.SetStateAction<string>>,
  setFinalPrompt: React.Dispatch<React.SetStateAction<string>>,
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>,
  selectedPrimary: string | null,
  selectedSecondary: string | null,
  user?: any,
  promptId?: string | null
) => {
  const { toast } = useToast();
  const { 
    isLoading, 
    setIsLoading, 
    currentLoadingMessage, 
    setCurrentLoadingMessage 
  } = useLoadingMessages();

  const handleAnalyze = async (images?: UploadedImage[], websiteData?: { url: string; instructions: string } | null) => {
    if (!promptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt before analyzing",
        variant: "destructive",
      });
      return;
    }
    
    // Add more detailed logging to verify what's being sent to the edge function
    console.log("Analysis requested with:", {
      promptLength: promptText.length,
      primaryToggle: selectedPrimary,
      secondaryToggle: selectedSecondary,
      hasImages: images && images.length > 0,
      imageCount: images ? images.length : 0,
      hasWebsiteData: !!websiteData,
      websiteUrl: websiteData ? websiteData.url : null,
      websiteInstructions: websiteData ? websiteData.instructions : null
    });
    
    const hasAdditionalContext = (images && images.length > 0) || (websiteData && websiteData.url);
    
    // Start loading immediately
    setIsLoading(true);
    
    // Get descriptive loading message
    setupLoadingMessage(images, websiteData);
    
    try {
      // Create the payload for analysis
      const payload = await createAnalysisPayload(
        promptText,
        selectedPrimary,
        selectedSecondary,
        images,
        websiteData,
        user,
        promptId
      );
      
      // Verify payload contents before sending
      console.log("Payload prepared for analysis:", {
        hasPromptText: !!payload.promptText,
        promptTextLength: payload.promptText?.length,
        hasImageData: !!payload.imageData,
        hasWebsiteData: !!payload.websiteData,
        websiteUrl: payload.websiteData?.url,
        primaryToggle: payload.primaryToggle,
        secondaryToggle: payload.secondaryToggle
      });
      
      // Send the analysis request
      const data = await analyzePrompt(payload);
      
      if (data) {
        console.log("AI analysis response:", data);
        
        // Check if there was an error in the edge function (which still returns 200)
        if (data.error) {
          console.warn("Edge function encountered an error:", data.error);
          // We still continue processing the fallback data provided
        }
        
        processQuestions(data);
        processVariables(data);
        
        if (data.masterCommand) {
          setMasterCommand(data.masterCommand);
        }
        
        if (data.enhancedPrompt) {
          setFinalPrompt(data.enhancedPrompt);
        }
        
        // If we received raw analysis, log it for debugging
        if (data.rawAnalysis) {
          console.log("Raw AI analysis:", data.rawAnalysis);
        }
        
        // Log token usage if available
        if (data.usage) {
          console.log("Token usage:", data.usage);
          console.log(`Prompt tokens: ${data.usage.prompt_tokens}, Completion tokens: ${data.usage.completion_tokens}`);
        }
      } else {
        console.warn("No data received from analysis function, using fallbacks");
        setQuestions(mockQuestions);
      }
    } catch (error) {
      console.error("Error analyzing prompt with AI:", error);
      toast({
        title: "Analysis Error",
        description: "There was an error analyzing your prompt. Using default questions instead.",
        variant: "destructive",
      });
      setQuestions(mockQuestions);
    } finally {
      // Keep loading state active for at least a few seconds to show the loading screen
      // This ensures a smoother transition even if the API is fast
      setTimeout(() => {
        setIsLoading(false);
        setCurrentStep(2);
      }, 3000);
    }
  };

  const setupLoadingMessage = (
    images?: UploadedImage[],
    websiteData?: { url: string; instructions: string } | null
  ) => {
    let loadingMessageText = "Analyzing your prompt";
    if (images && images.length > 0) {
      loadingMessageText += " and image";
    }
    if (websiteData && websiteData.url) {
      loadingMessageText += " and website content";
    }
    if (selectedPrimary) {
      const primaryToggles = require("@/components/dashboard/constants").primaryToggles;
      const primaryLabel = primaryToggles.find((t: any) => t.id === selectedPrimary)?.label;
      if (primaryLabel) {
        loadingMessageText += ` for ${primaryLabel}`;
      }
    }
    if (selectedSecondary) {
      const secondaryToggles = require("@/components/dashboard/constants").secondaryToggles;
      const secondaryLabel = secondaryToggles.find((t: any) => t.id === selectedSecondary)?.label;
      if (secondaryLabel) {
        loadingMessageText += ` with ${secondaryLabel} formatting`;
      }
    }
    loadingMessageText += "...";
    
    setCurrentLoadingMessage(loadingMessageText);
  };

  const processQuestions = (data: any) => {
    if (data.questions && data.questions.length > 0) {
      const aiQuestions = data.questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q${index + 1}`,
        // Keep pre-filled answers if they exist and we have additional context
        answer: data.hasAdditionalContext ? (q.answer || "") : "",
        // Mark as relevant if it has an answer
        isRelevant: q.answer && q.answer.trim() !== "" ? true : null
      }));
      
      setQuestions(aiQuestions);
    } else {
      console.warn("No questions received from analysis, using fallbacks");
      setQuestions(mockQuestions);
    }
  };

  const processVariables = async (data: any) => {
    if (data.variables && data.variables.length > 0) {
      // Additional filtering to ensure no invalid variables get through
      const validVariables = data.variables
        .filter((v: any) => 
          v.name && 
          isValidVariableName(v.name) && 
          v.name !== 'Task' && 
          v.name !== 'Persona' && 
          v.name !== 'Conditions' && 
          v.name !== 'Instructions'
        )
        .map((v: any, index: number) => ({
          ...v,
          id: v.id || `v${index + 1}`,
          // Only keep pre-filled values if we have additional context
          value: data.hasAdditionalContext ? (v.value || "") : "",
          // Mark as relevant if it has a value
          isRelevant: v.value && v.value.trim() !== "" ? true : null
        }));
        
      // If we have valid variables after filtering, use them
      if (validVariables.length > 0) {
        setVariables(validVariables);
      } else {
        // Otherwise use default variables from constants
        const { defaultVariables } = await import("@/components/dashboard/constants");
        setVariables(defaultVariables);
      }
    }
  };

  const enhancePromptWithGPT = async (
    promptToEnhance: string,
    questions: Question[],
    variables: Variable[]
  ): Promise<string> => {
    try {
      // Create a context-aware loading message based on toggles
      const result = await enhancePrompt(
        promptToEnhance, 
        questions, 
        variables, 
        selectedPrimary, 
        selectedSecondary, 
        user, 
        promptId
      );
      
      // Update loading message if available from the edge function
      if (result.loadingMessage) {
        setCurrentLoadingMessage(result.loadingMessage);
      }
      
      return result.enhancedPrompt;
    } catch (error) {
      console.error("Error enhancing prompt with GPT:", error);
      toast({
        title: "Error enhancing prompt",
        description: "An error occurred while enhancing your prompt. Please try again.",
        variant: "destructive",
      });
      return "Error enhancing prompt. Please try again.";
    }
  };

  return {
    isLoading,
    currentLoadingMessage,
    handleAnalyze,
    enhancePromptWithGPT
  };
};
