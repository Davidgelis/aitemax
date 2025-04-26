
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

      if (error) {
        console.error("Edge function error:", error);
        toast({
          title: "Analysis failed",
          description: error.message || "There was an error analyzing your prompt",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Analysis incomplete",
          description: "No analysis results were returned",
          variant: "destructive",
        });
        return;
      }

      // Check for missing pillar coverage
      if (data.debug?.missingPillars?.length > 0) {
        const missing = data.debug.missingPillars;
        toast({
          title: "Incomplete pillar coverage",
          description: `Some template pillars weren't addressed: ${missing.join(', ')}. Try adding more context to your prompt.`,
          variant: "warning",
        });
      }

      // Process and set questions & variables
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setVariables(Array.isArray(data.variables) ? data.variables : []);
      setMasterCommand(data.masterCommand || "");
      setFinalPrompt(data.enhancedPrompt || "");

      // Determine if we can proceed to step 2
      const hasQuestions = (data.questions?.length || 0) > 0;
      const hasVariables = (data.variables?.length || 0) > 0;
      const hasImageAnalysis = data.debug?.hasImageData;

      if (hasQuestions || hasVariables || hasImageAnalysis) {
        console.log("Moving to step 2 with:", {
          questions: data.questions?.length || 0,
          variables: data.variables?.length || 0,
          hasImageAnalysis,
          pillarCoverage: data.debug?.pillarCoverage
        });
        setCurrentStep(2);
      } else {
        toast({
          title: "Analysis incomplete",
          description: "Could not generate enough content. Try adding more details to your prompt.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error in handleAnalyze:", err);
      toast({
        title: "Analysis failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCurrentLoadingMessage("");
    }
  };

  return {
    isLoading,
    currentLoadingMessage,
    handleAnalyze
  };
};
