
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable } from "@/components/dashboard/types";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { useToast } from "@/hooks/use-toast";

export const usePromptAnalysis = (
  promptText: string,
  setQuestions: (questions: Question[]) => void,
  setVariables: (variables: Variable[]) => void,
  setMasterCommand: (command: string) => void,
  setFinalPrompt: (prompt: string) => void,
  setCurrentStep: (step: number) => void,
  user: any,
  currentPromptId: string | null
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState("");
  const { getCurrentTemplate } = useTemplateManagement();
  const { toast } = useToast();

  const handleAnalyze = async (
    uploadedImages: any[] | null = null,
    websiteContext: { url: string; instructions: string } | null = null,
    smartContext: { context: string; usageInstructions: string } | null = null
  ) => {
    setIsLoading(true);
    setCurrentLoadingMessage("Analyzing your prompt...");

    try {
      const currentTemplate = getCurrentTemplate();
      if (!promptText?.trim()) {
        throw new Error("Prompt text is required");
      }

      const { data, error } = await supabase.functions.invoke("analyze-prompt", {
        body: {
          promptText,
          userId: user?.id || null,
          promptId: currentPromptId,
          websiteData: websiteContext,
          imageData: uploadedImages,
          smartContextData: smartContext,
          template: currentTemplate,
          model: "gpt-4o"
        }
      });

      if (error || !data) {
        console.error('Analysis error:', error);
        toast({
          title: "Analysis failed",
          description: error?.message || "No data returned",
          variant: "destructive",
        });
        return;
      }

      // Process questions
      const questions = Array.isArray(data.questions) ? data.questions : [];
      setQuestions(questions);

      // Process and validate variables
      const rawVars = Array.isArray(data.variables) ? data.variables : [];
      console.log(`usePromptAnalysis: received ${rawVars.length} variables`);

      setVariables(rawVars);

      // Notify if no variables were generated
      if (!rawVars.length) {
        toast({
          title: "No variables detected",
          description: "Try adding more specific details to your prompt.",
          variant: "default"
        });
      }

      setMasterCommand(data.masterCommand || "");
      setFinalPrompt(data.enhancedPrompt || "");

      // Advance to next step if we have content
      if (questions.length > 0 || rawVars.length > 0 || data.debug?.hasImageData) {
        setCurrentStep(2);
      } else {
        toast({
          title: "Analysis incomplete",
          description: "Add more details to your prompt.",
          variant: "destructive",
        });
      }

    } catch (err) {
      console.error("Analysis error:", err);
      toast({
        title: "Analysis failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCurrentLoadingMessage("");
    }
  };

  const enhancePromptWithGPT = async (
    promptToEnhance: string,
    primaryToggle: string | null,
    secondaryToggle: string | null,
    setFinalPrompt: React.Dispatch<React.SetStateAction<string>>,
    answeredQuestions: Question[],
    relevantVariables: Variable[],
    selectedTemplate: any = null
  ): Promise<void> => {
    try {
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: {
          originalPrompt: promptToEnhance,
          answeredQuestions,
          relevantVariables,
          primaryToggle,
          secondaryToggle,
          userId: user?.id || null,
          promptId: currentPromptId,
          template: selectedTemplate
        }
      });
      
      if (error || !data?.enhancedPrompt) {
        throw new Error(error?.message || 'Failed to enhance prompt');
      }
      
      setFinalPrompt(data.enhancedPrompt);
    } catch (error) {
      throw error;
    }
  };

  return {
    isLoading,
    currentLoadingMessage,
    handleAnalyze,
    enhancePromptWithGPT
  };
};
