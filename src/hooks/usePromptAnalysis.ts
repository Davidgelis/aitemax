
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable } from "@/components/dashboard/types";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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

  // Function to extract image analysis questions from answers
  const extractQuestionsFromImageAnalysis = (questions: Question[]): Question[] => {
    const numberedQuestionRegex = /\d+\s*:\s*(.*?)(?=\d+\s*:|$)/g;
    const extractedQuestions: Question[] = [];
    
    // First check if any answers contain numbered questions (0: Question? 1: Question?)
    const questionsWithNumberedAnswers = questions.filter(q => {
      return q.answer && 
        (q.answer.includes("0:") || q.answer.includes("1:") || 
        q.answer.match(/\d+\.\s+[^.?!]*\?/g));
    });
    
    console.log("Found questions with numbered patterns:", questionsWithNumberedAnswers.length);
    
    if (questionsWithNumberedAnswers.length > 0) {
      // Process each question with numbered answers
      questionsWithNumberedAnswers.forEach(q => {
        if (!q.answer) return;
        
        // Parse out the numbered questions
        let match;
        const numberedPattern = /(\d+)\s*:\s*(.*?)(?=\d+\s*:|$)/g;
        while ((match = numberedPattern.exec(q.answer)) !== null) {
          const questionNum = match[1];
          const questionText = match[2].trim();
          
          if (questionText && questionText.length > 10) {
            extractedQuestions.push({
              id: `img-${q.id}-${questionNum}`,
              text: questionText,
              answer: "",
              isRelevant: true,
              category: q.category || "Image Analysis",
              contextSource: "image"
            });
          }
        }
        
        // Also check for numbered list format (1. Question?)
        const numberedListPattern = /(\d+)\.\s+([^.?!]*\?)/g;
        while ((match = numberedListPattern.exec(q.answer)) !== null) {
          const questionNum = match[1];
          const questionText = match[2].trim();
          
          if (questionText && questionText.length > 10) {
            extractedQuestions.push({
              id: `img-${q.id}-list-${questionNum}`,
              text: questionText,
              answer: "",
              isRelevant: true,
              category: q.category || "Image Analysis",
              contextSource: "image"
            });
          }
        }
        
        // Clean the original question's answer
        const firstLine = q.answer.split('\n')[0];
        q.answer = firstLine.replace(/based on image analysis:/i, '').trim();
      });
      
      console.log(`Extracted ${extractedQuestions.length} questions from image analysis`);
    }
    
    // Return the original questions plus any extracted questions
    return [...questions, ...extractedQuestions];
  };

  const handleAnalyze = async (
    uploadedImages: any[] | null = null,
    websiteContext: { url: string; instructions: string } | null = null,
    smartContext: { context: string; usageInstructions: string } | null = null
  ) => {
    console.log("Starting analysis with prompt:", promptText.substring(0, 50) + "...");
    setIsLoading(true);
    setCurrentLoadingMessage("Analyzing your prompt...");

    try {
      const currentTemplate = getCurrentTemplate();
      console.log("Using template for question generation:", {
        templateId: currentTemplate?.id,
        templateName: currentTemplate?.name,
        pillarsCount: currentTemplate?.pillars?.length || 0,
        pillars: currentTemplate?.pillars?.map(p => p.title).join(', ') || 'none'
      });

      // Check for template but don't block analysis for images
      const hasImages = !!uploadedImages && uploadedImages.length > 0;
      const hasValidImageData = hasImages && uploadedImages.some(img => img && img.base64 && img.context);
      
      if (!currentTemplate?.pillars?.length && !hasValidImageData) {
        console.warn("Template missing pillars and no image data available");
        toast({
          title: "Template note",
          description: "The template configuration might affect question generation.",
          variant: "default"
        });
      }

      if (!promptText?.trim()) {
        throw new Error("Prompt text is required");
      }

      console.log("Calling analyze-prompt edge function with:", {
        promptLength: promptText.length,
        hasImages,
        imagesData: uploadedImages?.map(img => ({
          id: img.id,
          hasBase64: !!img.base64,
          base64Length: img.base64 ? img.base64.length : 0,
          hasContext: !!img.context,
          contextText: img.context ? img.context.substring(0, 30) + '...' : 'none'
        })),
        hasValidImageData,
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
          websiteData: websiteContext,
          imageData: uploadedImages,
          smartContextData: smartContext,
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
        prefilledCount: data.questions?.filter(q => q.answer)?.length || 0,
        hasVariables: Array.isArray(data.variables),
        variablesCount: data.variables?.length || 0,
        hasValidImageData: data.debug?.hasValidImageData,
        imageAnalysisAvailable: data.debug?.imageAnalysisAvailable,
        pillarsCovered: data.debug?.pillarsCovered || 'none',
        debug: data.debug
      });

      // Check for data before setting questions
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        // Process questions to extract any embedded questions in answers
        const processedQuestions = data.debug?.hasValidImageData ? 
          extractQuestionsFromImageAnalysis(data.questions) : 
          data.questions;
        
        // Log prefilled questions to help debugging
        const prefilledQuestions = processedQuestions.filter(q => q.answer);
        if (prefilledQuestions.length > 0) {
          console.log(`Setting ${processedQuestions.length} questions with ${prefilledQuestions.length} prefilled answers`);
          
          // Log pillar coverage
          const pillarCoverage = prefilledQuestions.reduce((acc, q) => {
            acc[q.category] = (acc[q.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          console.log("Prefilled questions by pillar:", pillarCoverage);
          
          // Log first few prefilled questions
          prefilledQuestions.slice(0, 3).forEach(q => 
            console.log(`Prefilled Q: "${q.text.substring(0, 30)}..." with "${q.answer ? q.answer.substring(0, 30) : 'empty'}..."`));
        } else {
          console.log(`Setting ${processedQuestions.length} questions with no prefilled answers`);
        }
        
        setQuestions(processedQuestions);
      } else if (data.debug?.hasValidImageData) {
        console.warn("No questions generated despite valid image data");
        toast({
          title: "Image analysis note",
          description: "Could not generate specific questions from your image, proceeding with variables.",
          variant: "default"
        });
        setQuestions([]);
      } else if (data.debug?.isPromptSimple && !data.debug?.hasValidImageData) {
        console.log("No questions for simple prompt without image data");
        setQuestions([]);
      } else {
        console.warn("No questions in analysis result");
        setQuestions([]);
      }

      // Handle variables
      if (Array.isArray(data.variables)) {
        // Log prefilled variables to help debugging
        const prefilledVars = data.variables.filter(v => v.value);
        if (prefilledVars.length > 0) {
          console.log(`Setting ${data.variables.length} variables with ${prefilledVars.length} prefilled values`);
          
          // Log variable categories
          const varCategoryCoverage = prefilledVars.reduce((acc, v) => {
            acc[v.category] = (acc[v.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          console.log("Prefilled variables by category:", varCategoryCoverage);
          
          // Log example prefilled variables
          prefilledVars.slice(0, 3).forEach(v => 
            console.log(`Prefilled Var: "${v.name}" with "${v.value ? v.value.substring(0, 30) : 'empty'}..."`));
        } else {
          console.log(`Setting ${data.variables.length} variables with no prefilled values`);
        }
        
        setVariables(data.variables);
      } else {
        console.warn("No variables in analysis result");
        setVariables([]);
      }

      setMasterCommand(data.masterCommand || "");
      setFinalPrompt(data.enhancedPrompt || "");

      // Proceed to step 2 if we have either:
      // 1. Questions (regardless of source)
      // 2. Variables with at least some prefilled values from image analysis
      // 3. Valid image data (even without questions/variables)
      const hasPrefilledVars = Array.isArray(data.variables) && 
                               data.variables.some(v => v.value && v.contextSource === "image");
      
      if ((data.questions && data.questions.length > 0) || 
          (data.variables && data.variables.length > 0 && hasPrefilledVars) ||
          data.debug?.hasValidImageData) {
        console.log("Analysis successful, moving to step 2", {
          hasQuestions: data.questions && data.questions.length > 0,
          hasPrefilledVars,
          hasValidImageData: data.debug?.hasValidImageData,
          pillarsCovered: data.debug?.pillarsCovered || 'none'
        });
        setCurrentStep(2);
      } else if (data.variables && data.variables.length > 0) {
        // If we only have variables but none from image analysis, also proceed
        console.log("Moving to step 2 with variables only");
        setCurrentStep(2);
      } else {
        console.warn("Not enough content to proceed to step 2");
        toast({
          title: "Analysis incomplete",
          description: "Could not generate enough content from your prompt. Please try adding more details.",
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
          pillars: selectedTemplate.pillars?.map(p => p.title).join(', ') || 'none',
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
