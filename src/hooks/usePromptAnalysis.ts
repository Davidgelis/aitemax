
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable } from "@/components/dashboard/types";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { useToast } from "@/hooks/use-toast";

// Define loading states for better user feedback
type LoadingState = {
  isLoading: boolean;
  stage: 'initial' | 'analyzing' | 'processing-variables' | 'processing-questions' | 'enhancing' | 'complete';
  message: string;
};

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
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    stage: 'initial',
    message: ""
  });
  
  const { getCurrentTemplate } = useTemplateManagement();
  const { toast } = useToast();
  
  // Create a derived isLoading state for backward compatibility
  const isLoading = loadingState.isLoading;
  const currentLoadingMessage = loadingState.message;

  // Cache for recent analyses to prevent unnecessary API calls
  const analysisCache = new Map<string, any>();
  const cacheKey = (text: string, images?: any[], website?: any, context?: any) => {
    return `${text}|${images ? images.length : 0}|${website ? 'y' : 'n'}|${context ? 'y' : 'n'}`;
  };

  const updateLoadingState = (stage: LoadingState['stage'], message: string) => {
    setLoadingState({
      isLoading: stage !== 'complete',
      stage,
      message
    });
    console.log(`Loading state: ${stage} - ${message}`);
  };

  const handleAnalyze = async (
    uploadedImages: any[] | null = null,
    websiteContext: { url: string; instructions: string } | null = null,
    smartContext: { context: string; usageInstructions: string } | null = null
  ) => {
    updateLoadingState('analyzing', "Analyzing your prompt...");
    
    try {
      const currentTemplate = getCurrentTemplate();
      if (!promptText?.trim()) {
        throw new Error("Prompt text is required");
      }

      // Check cache first to see if we've already analyzed this prompt with similar parameters
      const key = cacheKey(promptText, uploadedImages, websiteContext, smartContext);
      if (analysisCache.has(key)) {
        console.log("Using cached analysis result");
        const cachedData = analysisCache.get(key);
        
        updateLoadingState('processing-questions', "Processing questions...");
        setQuestions(cachedData.questions || []);
        
        updateLoadingState('processing-variables', "Processing variables...");
        setVariables(cachedData.variables || []);
        
        setMasterCommand(cachedData.masterCommand || "");
        setFinalPrompt(cachedData.enhancedPrompt || "");
        
        updateLoadingState('complete', "Analysis complete!");
        
        // Still advance to next step if we have content
        if ((cachedData.questions?.length > 0 || cachedData.variables?.length > 0 || cachedData.debug?.hasImageData)) {
          setCurrentStep(2);
        }
        
        return;
      }

      // Set up timeout handling using Promise.race
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Analysis timed out after 60 seconds")), 60000);
      });

      // Main analysis promise
      const analysisPromise = async () => {
        updateLoadingState('analyzing', "Connecting to AI model...");
        
        const { data, error } = await supabase.functions.invoke("analyze-prompt", {
          body: {
            promptText,
            userId: user?.id || null,
            promptId: currentPromptId,
            websiteData: websiteContext,
            imageData: uploadedImages,
            smartContextData: smartContext,
            template: currentTemplate,
            model: "gpt-4o-mini" // Use faster model by default
          }
        });
        
        if (error || !data) {
          console.error('Analysis error:', error);
          throw new Error(error?.message || "No data returned");
        }
        
        return data;
      };

      // Race between timeout and the actual analysis
      const data = await Promise.race([
        analysisPromise(),
        timeoutPromise
      ]) as any;

      // Cache the result for future use
      analysisCache.set(key, data);
      
      // Process questions
      updateLoadingState('processing-questions', "Processing questions...");
      const questions = Array.isArray(data.questions) ? data.questions : [];
      setQuestions(questions);

      // Process and validate variables
      updateLoadingState('processing-variables', "Processing variables...");
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
      
      updateLoadingState('complete', "Analysis complete!");

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
      updateLoadingState('complete', "");
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
      updateLoadingState('enhancing', "Enhancing your prompt with Aitema X...");
      
      // Similar timeout pattern for enhancement
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Enhancement timed out after 60 seconds")), 60000);
      });
      
      const enhancePromise = async () => {
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
        
        return data;
      };
      
      const data = await Promise.race([enhancePromise(), timeoutPromise]);
      setFinalPrompt((data as any).enhancedPrompt);
      updateLoadingState('complete', "Enhancement complete!");
    } catch (error) {
      updateLoadingState('complete', "");
      throw error;
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
