
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
          variant: "default",
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

  // Add the enhancePromptWithGPT method to fix the error
  const enhancePromptWithGPT = async (
    promptToEnhance: string,
    primaryToggle: string | null,
    secondaryToggle: string | null,
    setFinalPrompt: React.Dispatch<React.SetStateAction<string>>,
    answeredQuestions: Question[],
    relevantVariables: Variable[],
    selectedTemplate: any = null
  ) => {
    setIsLoading(true);
    setCurrentLoadingMessage("Enhancing your prompt...");
    
    try {
      // Enhanced template validation
      const isValidTemplate = selectedTemplate && 
                             typeof selectedTemplate === 'object' && 
                             selectedTemplate.name && 
                             Array.isArray(selectedTemplate.pillars) &&
                             selectedTemplate.pillars.length > 0;
      
      console.log("usePromptAnalysis: Template being used:", 
        isValidTemplate ? {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          pillarsCount: selectedTemplate.pillars.length,
          temperature: selectedTemplate.temperature
        } : "Invalid or no template");
      
      // Always create a deep copy to prevent reference issues
      let templateCopy = null;
      if (selectedTemplate && isValidTemplate) {
        try {
          templateCopy = JSON.parse(JSON.stringify(selectedTemplate));
          console.log("Template successfully copied:", templateCopy.name);
        } catch (copyError) {
          console.error("Error creating template copy:", copyError);
        }
      }
      
      console.log("usePromptAnalysis: Calling enhance-prompt with:", {
        originalPrompt: promptToEnhance.substring(0, 50) + "...",
        answeredQuestions: answeredQuestions.length,
        relevantVariables: relevantVariables.length,
        primaryToggle,
        secondaryToggle
      });
      
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: {
          originalPrompt: promptToEnhance,
          answeredQuestions,
          relevantVariables,
          primaryToggle,
          secondaryToggle,
          userId: user?.id,
          promptId: currentPromptId,
          template: templateCopy
        }
      });
      
      if (error) {
        console.error("Error from enhance-prompt edge function:", error);
        throw new Error(`Error enhancing prompt: ${error.message}`);
      }
      
      if (!data || !data.enhancedPrompt) {
        console.error("No enhanced prompt returned from edge function");
        throw new Error("No enhanced prompt returned");
      }
      
      console.log("Enhanced prompt received (length):", data.enhancedPrompt.length);
      setFinalPrompt(data.enhancedPrompt);
    } catch (error) {
      console.error("Error in enhancePromptWithGPT:", error);
      toast({
        title: "Enhancement failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
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
