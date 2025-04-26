
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
        console.error("Analysis error:", error);
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

      // Filter and process variables
      const rawVars: Variable[] = Array.isArray(data.variables) ? data.variables : [];
      const filteredVars = rawVars
        .map(v => ({
          ...v,
          name: v.name.trim().split(/\s+/).slice(0, 3).join(' ') // Limit to 3 words
        }))
        .filter(v => {
          const wordCount = v.name.split(/\s+/).length;
          if (wordCount < 1 || wordCount > 3) return false;
          
          // Check for overlap with question topics
          return !questions.some(q => 
            q.text.toLowerCase().includes(v.name.toLowerCase())
          );
        });

      // Limit to 8 variables
      const limitedVars = filteredVars.slice(0, 8);
      if (filteredVars.length > 8) {
        toast({
          title: "Variable limit reached",
          description: "Only the first 8 variables were kept.",
          variant: "warning",
        });
      }
      
      setVariables(limitedVars);
      setMasterCommand(data.masterCommand || "");
      setFinalPrompt(data.enhancedPrompt || "");

      // Advance to next step if we have content
      if (questions.length > 0 || limitedVars.length > 0 || data.debug?.hasImageData) {
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

  return {
    isLoading,
    currentLoadingMessage,
    handleAnalyze
  };
};
