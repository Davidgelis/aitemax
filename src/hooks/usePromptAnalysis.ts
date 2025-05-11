import { useState, useCallback } from "react";
import { Question, Variable, UploadedImage } from "@/components/dashboard/types";
import { ModelFetchService } from "@/services/model/ModelFetchService";
import { useToast } from "@/hooks/use-toast";

interface LoadingState {
  isLoading: boolean;
  message: string;
}

export const usePromptAnalysis = (
  promptText: string,
  setQuestions: (questions: Question[]) => void,
  setVariables: (variables: Variable[]) => void,
  setMasterCommand: (command: string) => void,
  setFinalPrompt: (prompt: string) => void,
  jumpToStep: (step: number) => void,
  user: any,
  currentPromptId: string | null
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState | null>(null);
  const { toast } = useToast();

  const setLoading = (loading: boolean, message: string = "") => {
    setIsLoading(loading);
    setCurrentLoadingMessage(message);
    setLoadingState({ isLoading: loading, message });
  };

  const handleAnalyze = useCallback(
    async (images: UploadedImage[] | null, websiteContext: { url: string; instructions: string } | null, smartContext: { context: string; usageInstructions: string } | null) => {
      if (!promptText.trim()) {
        toast({
          title: "Error",
          description: "Please enter a prompt before analyzing.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true, "Analyzing your prompt...");

      try {
        const modelService = new ModelFetchService();
        const analysisResult = await modelService.analyzePrompt(
          promptText,
          user?.id,
          images,
          websiteContext,
          smartContext,
          currentPromptId
        );

        if (analysisResult) {
          setQuestions(analysisResult.questions);
          setVariables(analysisResult.variables);
          setMasterCommand(analysisResult.masterCommand);
          setFinalPrompt(""); // Clear any previous final prompt
          jumpToStep(2);
        } else {
          toast({
            title: "Analysis Failed",
            description: "Failed to analyze the prompt. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error during prompt analysis:", error);
        toast({
          title: "Analysis Error",
          description: error.message || "Failed to analyze the prompt due to an unexpected error.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [promptText, setQuestions, setVariables, setMasterCommand, setFinalPrompt, jumpToStep, user, toast, currentPromptId]
  );

  const enhancePromptWithGPT = async (
    prompt: string,
    primary: string | null,
    secondary: string | null,
    setFinalPrompt: (prompt: string) => void,
    answeredQuestions: Question[],
    relevantVariables: Variable[],
    template: any
  ) => {
    setLoading(true, "Enhancing prompt with GPT...");
    try {
      const modelService = new ModelFetchService();
      const enhancedPrompt = await modelService.enhancePrompt(
        prompt,
        primary,
        secondary,
        answeredQuestions,
        relevantVariables,
        template
      );

      if (enhancedPrompt) {
        setFinalPrompt(enhancedPrompt);
      } else {
        toast({
          title: "Enhancement Failed",
          description: "Failed to enhance the prompt. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error during prompt enhancement:", error);
      toast({
        title: "Enhancement Error",
        description: error.message || "Failed to enhance the prompt due to an unexpected error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isLoading,
    currentLoadingMessage,
    loadingState,
    handleAnalyze,
    enhancePromptWithGPT
  };
};
