import { useState, useEffect } from "react";
import { Question, Variable, UploadedImage } from "@/components/dashboard/types";
import { loadingMessages, mockQuestions } from "@/components/dashboard/constants";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Helper function to validate variable names
const isValidVariableName = (name: string): boolean => {
  // Check if name is longer than 1 character and not just asterisks or "s"
  return name.trim().length > 1 && 
         !/^\*+$/.test(name) && 
         !/^[sS]$/.test(name);
};

// Helper function to convert image to base64
const imageToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert image to base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const usePromptAnalysis = (
  promptText: string,
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>,
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>,
  setMasterCommand: React.Dispatch<React.SetStateAction<string>>,
  setFinalPrompt: React.Dispatch<React.SetStateAction<string>>,
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>,
  selectedPrimary: string | null,
  selectedSecondary: string | null,
  user?: any,
  promptId?: string | null
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState<number | string>(0);
  const { toast } = useToast();

  // Show loading messages while isLoading is true
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      // Set up an interval to rotate through loading messages
      timeout = setTimeout(() => {
        if (typeof currentLoadingMessage === 'number' && currentLoadingMessage < loadingMessages.length - 1) {
          setCurrentLoadingMessage(prev => {
            if (typeof prev === 'number') {
              return prev + 1;
            }
            return 0;
          });
        } else {
          // Loop back to first message if we've reached the end
          setCurrentLoadingMessage(0);
        }
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [isLoading, currentLoadingMessage]);

  const handleAnalyze = async (images?: UploadedImage[], websiteData?: { url: string; instructions: string } | null) => {
    if (!promptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt before analyzing",
        variant: "destructive",
      });
      return;
    }
    
    // Add more detailed logging to verify what's being sent to the edge function
    console.log("Analysis requested with:", {
      promptLength: promptText.length,
      primaryToggle: selectedPrimary,
      secondaryToggle: selectedSecondary,
      hasImages: images && images.length > 0,
      imageCount: images ? images.length : 0,
      hasWebsiteData: !!websiteData,
      websiteUrl: websiteData ? websiteData.url : null
    });
    
    const hasAdditionalContext = (images && images.length > 0) || (websiteData && websiteData.url);
    
    // Start loading immediately
    setIsLoading(true);
    
    try {
      // Include userId and promptId in the payload if available
      const payload: any = {
        promptText,
        primaryToggle: selectedPrimary,
        secondaryToggle: selectedSecondary
      };
      
      // Add user and prompt ID if available
      if (user) {
        payload.userId = user.id;
      }
      
      if (promptId) {
        payload.promptId = promptId;
      }
      
      // Add website data if available
      if (websiteData && websiteData.url) {
        console.log("Including website data in analysis payload:", websiteData);
        payload.websiteData = websiteData;
      }
      
      // Add image data if available
      if (images && images.length > 0) {
        const firstImage = images[0];
        try {
          console.log("Converting image to base64 for analysis:", firstImage.file.name);
          const base64 = await imageToBase64(firstImage.file);
          payload.imageData = { 
            base64,
            filename: firstImage.file.name,
            type: firstImage.file.type
          };
          console.log("Image successfully converted and added to payload");
        } catch (error) {
          console.error("Error converting image to base64:", error);
        }
      }
      
      console.log("Sending analysis request with context flags:", { 
        primaryToggle: selectedPrimary, 
        secondaryToggle: selectedSecondary,
        hasImage: !!(images && images.length > 0),
        hasWebsite: !!(websiteData && websiteData.url),
        hasAdditionalContext
      });
      
      const { data, error } = await supabase.functions.invoke('analyze-prompt', {
        body: payload
      });
      
      if (error) throw error;
      
      if (data) {
        console.log("AI analysis response:", data);
        
        // Check if we have pre-filled questions
        const hasPrefilled = data.questions && data.questions.some((q: any) => q.answer && q.answer.trim() !== "") ||
                             data.variables && data.variables.some((v: any) => v.value && v.value.trim() !== "");
        
        console.log(`Response contains pre-filled content: ${hasPrefilled ? "YES" : "NO"}`);
        
        if (data.questions && data.questions.length > 0) {
          // Ensure pre-filled questions have isRelevant set to true
          const aiQuestions = data.questions.map((q: any, index: number) => ({
            ...q,
            id: q.id || `q${index + 1}`,
            // If question has an answer, make sure isRelevant is true
            isRelevant: q.answer && q.answer.trim() !== "" ? true : q.isRelevant
          }));
          
          setQuestions(aiQuestions);
          
          // Log pre-filled question answers
          const prefilledQuestions = aiQuestions.filter((q: Question) => q.answer && q.answer.trim() !== '');
          if (prefilledQuestions.length > 0) {
            console.log(`Received ${prefilledQuestions.length} pre-filled question answers from AI analysis`);
            prefilledQuestions.forEach((q: Question) => {
              console.log(`  - Question: "${q.text}", Answer: "${q.answer}"`);
            });
          }
        } else {
          console.warn("No questions received from analysis, using fallbacks");
          const { mockQuestions } = await import("@/components/dashboard/constants");
          setQuestions(mockQuestions);
        }
        
        if (data.variables && data.variables.length > 0) {
          // Additional filtering to ensure no invalid variables get through
          const validVariables = data.variables
            .filter((v: any) => 
              v.name && 
              isValidVariableName(v.name) && 
              v.name !== 'Task' && 
              v.name !== 'Persona' && 
              v.name !== 'Conditions' && 
              v.name !== 'Instructions'
            )
            .map((v: any, index: number) => ({
              ...v,
              id: v.id || `v${index + 1}`,
              // If variable has a value, make sure isRelevant is true
              isRelevant: v.value && v.value.trim() !== "" ? true : v.isRelevant,
              // Add code field if missing
              code: v.code || `VAR_${index + 1}`
            }));
            
          // If we have valid variables after filtering, use them
          if (validVariables.length > 0) {
            console.log("Setting variables with pre-filled values:", validVariables);
            setVariables(validVariables);
            
            // Log pre-filled variable values
            const prefilledVariables = validVariables.filter((v: Variable) => v.value && v.value.trim() !== '');
            if (prefilledVariables.length > 0) {
              console.log(`Received ${prefilledVariables.length} pre-filled variable values from AI analysis`);
              prefilledVariables.forEach((v: Variable) => {
                console.log(`  - ${v.name}: "${v.value}"`);
              });
            }
          } else {
            // Otherwise use default variables from constants
            const { defaultVariables } = await import("@/components/dashboard/constants");
            setVariables(defaultVariables);
          }
        } else {
          console.warn("No variables received from analysis, using defaults");
          const { defaultVariables } = await import("@/components/dashboard/constants");
          setVariables(defaultVariables);
        }
        
        if (data.masterCommand) {
          setMasterCommand(data.masterCommand);
        }
        
        if (data.enhancedPrompt) {
          setFinalPrompt(data.enhancedPrompt);
        }
      } else {
        console.warn("No data received from analysis function, using fallbacks");
        const { mockQuestions, defaultVariables } = await import("@/components/dashboard/constants");
        setQuestions(mockQuestions);
        setVariables(defaultVariables);
      }
    } catch (error) {
      console.error("Error analyzing prompt with AI:", error);
      toast({
        title: "Analysis Error",
        description: "There was an error analyzing your prompt. Using default questions instead.",
        variant: "destructive",
      });
      const { mockQuestions, defaultVariables } = await import("@/components/dashboard/constants");
      setQuestions(mockQuestions);
      setVariables(defaultVariables);
    } finally {
      // Keep loading state active for at least a few seconds to show the loading screen
      // This ensures a smoother transition even if the API is fast
      setTimeout(() => {
        setIsLoading(false);
        setCurrentStep(2);
      }, 1500);
    }
  };

  const enhancePromptWithGPT = async (
    promptToEnhance: string,
    questions: Question[],
    variables: Variable[]
  ): Promise<string> => {
    try {
      // Create a context-aware loading message based on toggles
      let message = "Enhancing your prompt";
      if (selectedPrimary) {
        const primaryToggles = (await import("@/components/dashboard/constants")).primaryToggles;
        const primaryLabel = primaryToggles.find(t => t.id === selectedPrimary)?.label || selectedPrimary;
        message += ` for ${primaryLabel}`;
        
        if (selectedSecondary) {
          const secondaryToggles = (await import("@/components/dashboard/constants")).secondaryToggles;
          const secondaryLabel = secondaryToggles.find(t => t.id === selectedSecondary)?.label || selectedSecondary;
          message += ` and to be ${secondaryLabel}`;
        }
      } else if (selectedSecondary) {
        const secondaryToggles = (await import("@/components/dashboard/constants")).secondaryToggles;
        const secondaryLabel = secondaryToggles.find(t => t.id === selectedSecondary)?.label || selectedSecondary;
        message += ` to be ${secondaryLabel}`;
      }
      message += "...";
      
      // Set the customized loading message
      setCurrentLoadingMessage(message);
      
      // Filter out only answered and relevant questions
      const answeredQuestions = questions.filter(
        q => q.answer && q.answer.trim() !== "" && q.isRelevant !== false
      );
      
      // Filter out only relevant variables
      const relevantVariables = variables.filter(
        v => v.isRelevant === true
      );
      
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: {
          originalPrompt: promptToEnhance,
          answeredQuestions,
          relevantVariables,
          primaryToggle: selectedPrimary,
          secondaryToggle: selectedSecondary,
          userId: user?.id,
          promptId
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update loading message if available from the edge function
      if (data.loadingMessage) {
        setCurrentLoadingMessage(data.loadingMessage);
      }
      
      return data.enhancedPrompt;
    } catch (error) {
      console.error("Error enhancing prompt with GPT:", error);
      toast({
        title: "Error enhancing prompt",
        description: "An error occurred while enhancing your prompt. Please try again.",
        variant: "destructive",
      });
      return "Error enhancing prompt. Please try again.";
    }
  };

  return {
    isLoading,
    currentLoadingMessage,
    handleAnalyze,
    enhancePromptWithGPT
  };
};
