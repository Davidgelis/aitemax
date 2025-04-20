import { useState, useCallback } from "react";
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
  selectedPrimary: string | null,
  selectedSecondary: string | null,
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
    console.log("Starting analysis with prompt:", promptText.substring(0, 50) + "...");
    setIsLoading(true);
    setCurrentLoadingMessage("Analyzing your prompt...");

    try {
      // Get the current template
      const currentTemplate = getCurrentTemplate();
      console.log("Using template:", {
        templateId: currentTemplate?.id,
        templateName: currentTemplate?.name,
        pillarsCount: currentTemplate?.pillars?.length || 0
      });

      // Add more robust input validation
      if (!promptText?.trim()) {
        throw new Error("Prompt text is required");
      }

      console.log("Calling analyze-prompt edge function with:", {
        promptLength: promptText.length,
        hasImages: !!uploadedImages && uploadedImages.length > 0,
        hasSmartContext: !!smartContext?.context,
        hasWebsiteContext: !!websiteContext?.url,
        model: "gpt-4o"
      });

      const { data, error } = await supabase.functions.invoke("analyze-prompt", {
        body: {
          promptText,
          primaryToggle: selectedPrimary,
          secondaryToggle: selectedSecondary,
          userId: user?.id || null,
          promptId: currentPromptId,
          websiteData: websiteContext || null,
          imageData: uploadedImages,
          smartContextData: smartContext || null,
          template: currentTemplate,
          model: "gpt-4o"
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast({
          title: "Analysis failed",
          description: "There was an error analyzing your prompt. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        console.error("No data returned from analysis");
        toast({
          title: "Analysis incomplete",
          description: "No analysis results were returned. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Analysis results:", {
        hasQuestions: Array.isArray(data.questions),
        questionsCount: data.questions?.length || 0,
        hasVariables: Array.isArray(data.variables),
        variablesCount: data.variables?.length || 0,
        hasMasterCommand: !!data.masterCommand,
        hasEnhancedPrompt: !!data.enhancedPrompt
      });

      // Process questions to ensure they're valid
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        const processedQuestions = data.questions.map((q: any) => ({
          id: q.id || `q-${Math.random()}`,
          text: q.text || "",
          answer: q.answer || "",
          isRelevant: q.isRelevant === null ? null : Boolean(q.isRelevant),
          category: q.category || "General"
        }));
        console.log(`Setting ${processedQuestions.length} processed questions`);
        setQuestions(processedQuestions);
      } else {
        console.warn("No questions in analysis result");
        setQuestions([]);
      }

      // Process variables to ensure they're valid
      if (Array.isArray(data.variables)) {
        const processedVariables = data.variables.map((v: any, index: number) => ({
          id: v.id || `var-${index + 1}`,
          name: v.name || `Variable ${index + 1}`,
          value: v.value || "",
          isRelevant: v.isRelevant === null ? null : Boolean(v.isRelevant),
          category: v.category || "General",
          code: v.code || `VAR_${index + 1}`
        }));
        console.log(`Setting ${processedVariables.length} processed variables`);
        setVariables(processedVariables);
      } else {
        console.warn("No variables in analysis result");
        setVariables([]);
      }

      setMasterCommand(data.masterCommand || "");
      setFinalPrompt(data.enhancedPrompt || "");

      // Only proceed to step 2 if we have valid questions
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        console.log("Analysis successful, moving to step 2");
        setCurrentStep(2);
      } else {
        console.warn("Not moving to step 2 - no valid questions");
        toast({
          title: "Analysis incomplete",
          description: "Could not generate questions for your prompt. Please try again or modify your prompt.",
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

  /**
   * Enhanced prompt with GPT with standardized parameter order
   * @param originalPrompt The original prompt text to enhance
   * @param primaryToggle Selected primary toggle
   * @param secondaryToggle Selected secondary toggle
   * @param setFinalPrompt Callback to set the final prompt
   * @param answeredQuestions Array of answered and relevant questions
   * @param relevantVariables Array of relevant variables
   * @param selectedTemplate The selected template to use
   */
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
      setCurrentLoadingMessage("Building your final prompt with Aitema X");
      
      // Log template information
      console.log("usePromptAnalysis: Template being used:", 
        selectedTemplate ? {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          pillarsCount: selectedTemplate.pillars?.length || 0,
          characterLimit: selectedTemplate.characterLimit || "default",
          temperature: selectedTemplate.temperature || "default"
        } : "No template provided");
      
      // Standardized template validation
      const isValidTemplate = selectedTemplate && 
                             typeof selectedTemplate === 'object' && 
                             selectedTemplate.name && 
                             Array.isArray(selectedTemplate.pillars) &&
                             selectedTemplate.pillars.length > 0 &&
                             selectedTemplate.pillars.every((p: any) => p && p.title && p.description);
      
      if (!isValidTemplate && selectedTemplate) {
        console.error("Invalid template structure:", JSON.stringify(selectedTemplate, null, 2));
      }
      
      // Always create a deep copy to prevent reference issues
      let templateCopy = null;
      if (selectedTemplate && isValidTemplate) {
        try {
          templateCopy = JSON.parse(JSON.stringify(selectedTemplate));
          console.log("Template successfully copied:", templateCopy.name);
        } catch (copyError) {
          console.error("Error creating template copy:", copyError);
          // Continue without template if copy fails
        }
      }
      
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
          template: templateCopy,  // Pass the template copy to the edge function
          model: "gpt-4o" // Use gpt-4o as default model
        }
      });
      
      if (error) {
        console.error("Error enhancing prompt:", error);
        setFinalPrompt(originalPrompt);
        return;
      }
      
      if (data?.error) {
        console.error("API error:", data.error);
        setFinalPrompt(originalPrompt);
        return;
      }
      
      if (data?.enhancedPrompt) {
        console.log("Enhanced prompt received:", data.enhancedPrompt.substring(0, 100) + "...");
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
