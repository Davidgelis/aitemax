
import { useState, useEffect } from "react";
import { Question, Variable } from "@/components/dashboard/types";
import { loadingMessages, mockQuestions, primaryToggles, secondaryToggles } from "@/components/dashboard/constants";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UploadedImage } from "@/components/dashboard/ImageUploader";

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
    
    // Start loading immediately
    setIsLoading(true);
    
    // Get toggle label for a more descriptive loading message
    let loadingMessageText = "Analyzing your prompt";
    if (images && images.length > 0) {
      loadingMessageText += " and image";
    }
    if (websiteData && websiteData.url) {
      loadingMessageText += " and website content";
    }
    if (selectedPrimary) {
      const primaryLabel = primaryToggles.find(t => t.id === selectedPrimary)?.label;
      if (primaryLabel) {
        loadingMessageText += ` for ${primaryLabel}`;
      }
    }
    if (selectedSecondary) {
      const secondaryLabel = secondaryToggles.find(t => t.id === selectedSecondary)?.label;
      if (secondaryLabel) {
        loadingMessageText += ` with ${secondaryLabel} formatting`;
      }
    }
    loadingMessageText += "...";
    
    setCurrentLoadingMessage(loadingMessageText);
    
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
        payload.websiteData = websiteData;
      }
      
      // Add image data if available
      if (images && images.length > 0) {
        const firstImage = images[0];
        try {
          const base64 = await imageToBase64(firstImage.file);
          payload.imageData = { 
            base64,
            filename: firstImage.file.name,
            type: firstImage.file.type
          };
        } catch (error) {
          console.error("Error converting image to base64:", error);
        }
      }
      
      console.log("Sending analysis request with toggles:", { 
        primaryToggle: selectedPrimary, 
        secondaryToggle: selectedSecondary,
        hasImage: !!(images && images.length > 0),
        hasWebsite: !!(websiteData && websiteData.url)
      });
      
      const { data, error } = await supabase.functions.invoke('analyze-prompt', {
        body: payload
      });
      
      if (error) throw error;
      
      if (data) {
        console.log("AI analysis response:", data);
        
        // Check if there was an error in the edge function (which still returns 200)
        if (data.error) {
          console.warn("Edge function encountered an error:", data.error);
          // We still continue processing the fallback data provided
        }
        
        if (data.questions && data.questions.length > 0) {
          const aiQuestions = data.questions.map((q: any, index: number) => ({
            ...q,
            id: q.id || `q${index + 1}`,
            answer: ""
          }));
          
          setQuestions(aiQuestions);
        } else {
          console.warn("No questions received from analysis, using fallbacks");
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
              value: v.value || ""
            }));
            
          // If we have valid variables after filtering, use them
          if (validVariables.length > 0) {
            setVariables(validVariables);
          } else {
            // Otherwise use default variables from constants
            const { defaultVariables } = await import("@/components/dashboard/constants");
            setVariables(defaultVariables);
          }
        }
        
        if (data.masterCommand) {
          setMasterCommand(data.masterCommand);
        }
        
        if (data.enhancedPrompt) {
          setFinalPrompt(data.enhancedPrompt);
        }
        
        // If we received raw analysis, log it for debugging
        if (data.rawAnalysis) {
          console.log("Raw AI analysis:", data.rawAnalysis);
        }
        
        // Log token usage if available
        if (data.usage) {
          console.log("Token usage:", data.usage);
          console.log(`Prompt tokens: ${data.usage.prompt_tokens}, Completion tokens: ${data.usage.completion_tokens}`);
        }
      } else {
        console.warn("No data received from analysis function, using fallbacks");
        setQuestions(mockQuestions);
      }
    } catch (error) {
      console.error("Error analyzing prompt with AI:", error);
      toast({
        title: "Analysis Error",
        description: "There was an error analyzing your prompt. Using default questions instead.",
        variant: "destructive",
      });
      setQuestions(mockQuestions);
    } finally {
      // Keep loading state active for at least a few seconds to show the loading screen
      // This ensures a smoother transition even if the API is fast
      setTimeout(() => {
        setIsLoading(false);
        setCurrentStep(2);
      }, 3000);
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
        const primaryLabel = primaryToggles.find(t => t.id === selectedPrimary)?.label || selectedPrimary;
        message += ` for ${primaryLabel}`;
        
        if (selectedSecondary) {
          const secondaryLabel = secondaryToggles.find(t => t.id === selectedSecondary)?.label || selectedSecondary;
          message += ` and to be ${secondaryLabel}`;
        }
      } else if (selectedSecondary) {
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
