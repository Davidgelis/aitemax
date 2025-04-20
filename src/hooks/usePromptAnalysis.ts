
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable } from "@/components/dashboard/types";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";

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

  const handleAnalyze = async (
    uploadedImages: any[] | null = null,
    websiteContext: { url: string; instructions: string } | null = null,
    smartContext: { context: string; usageInstructions: string } | null = null
  ) => {
    setIsLoading(true);
    setCurrentLoadingMessage("Analyzing your prompt with GPT-4o...");

    try {
      // Get the current template
      const currentTemplate = getCurrentTemplate();
      
      console.log("Analyze using template:", { 
        templateId: currentTemplate?.id,
        templateName: currentTemplate?.name,
        pillarsCount: currentTemplate?.pillars?.length || 0
      });

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
        uploadedImagesCount: uploadedImages?.length || 0,
        model: "gpt-4o" // Use gpt-4o as default model
      });

      // Prepare optimized images if available - focus on compression and validation
      let processedImages = null;
      if (uploadedImages && Array.isArray(uploadedImages) && uploadedImages.length > 0) {
        // Log but don't send full base64 to logs
        console.log("Processing images for analysis:", uploadedImages.map(img => ({
          hasBase64: !!img.base64,
          base64Length: img.base64 ? img.base64.length : 0,
          hasContext: !!img.context,
          contextLength: img.context ? img.context.length : 0
        })));
        
        // Just pass the images through, we'll optimize in the Edge Function
        processedImages = uploadedImages;
      }

      const { data, error } = await supabase.functions.invoke("analyze-prompt", {
        body: {
          promptText,
          primaryToggle: selectedPrimary,
          secondaryToggle: selectedSecondary,
          userId: user?.id || null,
          promptId: currentPromptId,
          websiteData: websiteContext || null,
          imageData: processedImages,
          smartContextData: smartContext || null,
          inputTypes,
          template: currentTemplate,  // Pass the template to the edge function
          model: "gpt-4o" // Pass model parameter explicitly
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
        console.log("Analysis result:", {
          questionsCount: data.questions?.length || 0,
          preFilledCount: data.questions?.filter((q: Question) => q.answer?.startsWith("PRE-FILLED:")).length || 0,
          imageBasedCount: data.questions?.filter((q: Question) => 
            q.answer?.includes("(from image analysis)") || q.answer?.includes("image")
          ).length || 0,
          variablesCount: data.variables?.length || 0,
          debug: data.debug
        });
        
        // Process questions to ensure they have proper categories based on template pillars
        if (data.questions && Array.isArray(data.questions) && currentTemplate?.pillars) {
          const pillarsMap = new Map();
          currentTemplate.pillars.forEach((pillar: any) => {
            pillarsMap.set(pillar.title.toLowerCase(), pillar.title);
          });
          
          // Ensure questions have proper category names matching the exact pillar titles
          data.questions = data.questions.map((q: Question) => {
            if (q.category) {
              const matchedPillar = currentTemplate.pillars.find((pillar: any) => 
                pillar.title.toLowerCase() === q.category.toLowerCase() ||
                q.category.toLowerCase().includes(pillar.title.toLowerCase()) ||
                pillar.title.toLowerCase().includes(q.category.toLowerCase())
              );
              
              if (matchedPillar) {
                return { ...q, category: matchedPillar.title };
              }
            }
            return q;
          });
        }
        
        // Add detailed logging for variables
        if (data.variables && data.variables.length > 0) {
          console.log("Extracted variables:", data.variables.map((v: Variable) => ({
            id: v.id,
            name: v.name,
            value: v.value?.substring(0, 30) + (v.value?.length > 30 ? '...' : ''),
            category: v.category,
            isRelevant: v.isRelevant,
            code: v.code
          })));
          
          // Process variables to ensure they have proper categories based on template pillars
          if (currentTemplate?.pillars) {
            data.variables = data.variables.map((v: Variable) => {
              if (v.category) {
                const matchedPillar = currentTemplate.pillars.find((pillar: any) => 
                  pillar.title.toLowerCase() === v.category.toLowerCase() ||
                  v.category.toLowerCase().includes(pillar.title.toLowerCase()) ||
                  pillar.title.toLowerCase().includes(v.category.toLowerCase())
                );
                
                if (matchedPillar) {
                  return { ...v, category: matchedPillar.title };
                }
              }
              return v;
            });
          }
        } else {
          console.warn("No variables were extracted from the analysis");
        }
        
        setQuestions(data.questions || []);
        
        // Ensure variables are properly initialized even if none were returned
        if (data.variables && Array.isArray(data.variables)) {
          // Make sure all variables have required fields
          const processedVariables = data.variables.map((v: any, index: number) => ({
            id: v.id || `var-${index}`,
            name: v.name || `Variable ${index + 1}`,
            value: v.value || '',
            isRelevant: v.isRelevant === undefined ? true : v.isRelevant,
            category: v.category || 'Other',
            code: v.code || `VAR_${index + 1}`
          }));
          setVariables(processedVariables);
        } else {
          console.log("No variables found in analysis result, initializing empty array");
          setVariables([]);
        }
        
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
