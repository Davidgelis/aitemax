import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable } from "@/components/dashboard/types";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { useToast } from "@/hooks/use-toast";
import { GPT41_ID } from "@/services/model/ModelFetchService";

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

  // ─── improved image processor ──────────────────────────────
  /**
   * Strip un-serialisable fields (`file`) and guarantee the edge-function
   * payload stays well below Supabase's 1 MB limit.
   *
   * • keeps only id + context + (base64 ≤ 650 kB)  
   * • if the base64 is bigger we send **no base64 at all** – the server
   *   will simply analyse the text without vision.
   */
  const processSafeImages = (images: any[] | null) => {
    if (!images || !images.length) {
      console.log("No images to process");
      return null;
    }

    console.log(`Processing ${images.length} images for analysis`);
    
    return images.map(({ id, base64 = "", context = "", url = "" }) => {
      // If base64 is too large, don't send it
      if (base64 && base64.length > 650_000) {
        console.warn(`[SAFE-IMG] image ${id} base64 is ${base64.length} chars – too large, sending without base64`);
        return { id, context, base64: null };
      }
      
      console.log(`[SAFE-IMG] image ${id} base64 length: ${base64?.length || 0} chars, has context: ${!!context}`);
      return { id, context, base64: base64 || null };
    });
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
      
      // Only process additional context if provided by user
      const hasImageData = uploadedImages && uploadedImages.length > 0;
      const hasWebsiteContext = websiteContext && websiteContext.url && websiteContext.instructions;
      const hasSmartContext = smartContext && smartContext.context;
      
      console.log(`Context analysis - Images: ${hasImageData ? 'YES' : 'NO'}, Website: ${hasWebsiteContext ? 'YES' : 'NO'}, Smart: ${hasSmartContext ? 'YES' : 'NO'}`);

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
        setTimeout(() => reject(new Error("Analysis timed out after 90 seconds")), 90000);
      });

      // Main analysis promise
      const analysisPromise = async () => {
        updateLoadingState('analyzing', "Connecting to AI model...");
        
        // Build the payload with only user-provided context
        const payload: any = {
          promptText,
          userId: user?.id ?? null,
          promptId: currentPromptId,
          template: currentTemplate,
          model: GPT41_ID
        };
        
        // Only add context data if actually provided by user
        if (hasWebsiteContext) {
          payload.websiteData = websiteContext;
          console.log("Adding website context to payload:", websiteContext.url);
        }
        
        if (hasSmartContext) {
          payload.smartContextData = smartContext;
          console.log("Adding smart context to payload");
        }
        
        // Process images if provided
        if (hasImageData) {
          const safeImages = processSafeImages(uploadedImages);
          if (safeImages && safeImages.length > 0) {
            payload.imageData = safeImages;
            console.log(`Adding ${safeImages.length} processed images to payload`);
          }
        }
        
        console.log(`Sending request to analyze-prompt with model: ${GPT41_ID}`);
        
        const { data, error } = await supabase.functions.invoke(
          "analyze-prompt", 
          { body: payload }
        );
        
        if (error || !data) {
          console.error('Analysis error:', error);
          throw new Error(error?.message || "No data returned from analysis");
        }
        
        console.log(`Received response from analyze-prompt with model: ${GPT41_ID}`);
        return data;
      };

      // Race the API call against the timeout
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
        setTimeout(() => reject(new Error("Enhancement timed out after 90 seconds")), 90000);
      });
      
      const enhancePromise = async () => {
        // Create payload and let supabase client handle serialization
        const payload = {
          originalPrompt: promptToEnhance,
          answeredQuestions,
          relevantVariables,
          primaryToggle,
          secondaryToggle,
          userId: user?.id || null,
          promptId: currentPromptId,
          template: selectedTemplate
        };
        
        const { data, error } = await supabase.functions.invoke(
          'enhance-prompt', 
          { body: payload }
        );
        
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

// Keep the existing enhancePromptWithTemplate function
export const enhancePromptWithTemplate = async (
  promptToEnhance: string,
  answeredQuestions: Question[],
  relevantVariables: Variable[],
  primaryToggle: string | null,
  secondaryToggle: string | null,
  user: any,
  promptId: string | null,
  template: any | null
): Promise<string | null> => {
  try {
    console.log(`Enhancing prompt template with ${answeredQuestions.length} questions and ${relevantVariables.length} variables`);
    
    if (!promptToEnhance) {
      console.error('No prompt to enhance');
      return null;
    }
    
    // Clone template to avoid mutating the original
    const templateCopy = template ? { ...template } : null;
    
    // Clean template of any non-serializable fields
    if (templateCopy) {
      delete templateCopy.draftId;
      delete templateCopy.status;
      delete templateCopy.isDefault;
      delete templateCopy.created_at;
      delete templateCopy.updated_at;
      delete templateCopy.__typename;
    }
    
    // Create payload and let supabase client handle serialization
    const payload = {
      originalPrompt: promptToEnhance,
      answeredQuestions,
      relevantVariables,
      primaryToggle,
      secondaryToggle,
      userId: user?.id,
      promptId,
      template: templateCopy // Pass the clean template copy
    };
    
    const { data, error } = await supabase.functions.invoke(
      'enhance-prompt',
      { body: payload }
    );
    
    if (error) {
      console.error('Error enhancing prompt:', error);
      throw new Error(error.message);
    }
    
    console.log('Prompt enhanced successfully');
    return data?.enhancedPrompt || null;
  } catch (error) {
    console.error('Error in enhancePromptWithTemplate:', error);
    return null;
  }
};
