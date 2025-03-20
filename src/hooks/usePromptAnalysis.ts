import { useState, useEffect } from "react";
import { Question, Variable, UploadedImage } from "@/components/dashboard/types";
import { loadingMessages, mockQuestions, primaryToggles, secondaryToggles } from "@/components/dashboard/constants";
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
  const [analyzedQuestions, setAnalyzedQuestions] = useState<Question[]>([]);
  const [analyzedVariables, setAnalyzedVariables] = useState<Variable[]>([]);
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

  const handleAnalyze = async (
    images?: UploadedImage[], 
    websiteData?: { url: string; instructions: string } | null,
    smartContextData?: { context: string; usageInstructions: string } | null
  ) => {
    if (!promptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt before analyzing",
        variant: "destructive",
      });
      return;
    }
    
    // Detailed logging for input types and their availability
    console.log("Analysis initiated with the following inputs:");
    console.log(`- Text input: ${promptText.length > 0 ? "Available" : "Not available"}`);
    console.log(`- Primary toggle: ${selectedPrimary || "None selected"}`);
    console.log(`- Secondary toggle: ${selectedSecondary || "None selected"}`);
    console.log(`- WebSmart scan: ${websiteData && websiteData.url ? "Active" : "Not active"}`);
    console.log(`- Image Smart scan: ${images && images.length > 0 ? "Active" : "Not active"}`);
    console.log(`- Smart Context: ${smartContextData && smartContextData.context ? "Active" : "Not active"}`);
    
    if (websiteData && websiteData.url) {
      console.log(`  WebSmart URL: ${websiteData.url}`);
      console.log(`  WebSmart instructions: ${websiteData.instructions || "None provided"}`);
    }
    
    if (images && images.length > 0) {
      console.log(`  Image count: ${images.length}`);
      images.forEach((img, idx) => {
        console.log(`  Image ${idx+1}: ${img.file.name} (${img.file.type}), Context: ${img.context || "None provided"}`);
      });
    }
    
    if (smartContextData && smartContextData.context) {
      console.log(`  Smart Context provided: ${smartContextData.context.substring(0, 50)}...`);
      console.log(`  Smart Context usage instructions: ${smartContextData.usageInstructions || "None provided"}`);
    }
    
    // Start loading immediately
    setIsLoading(true);
    
    // Prepare a contextual loading message based on active inputs
    let loadingMessageText = "Analyzing your prompt";
    
    // Add context about which inputs are being processed
    const activeInputs = [];
    if (images && images.length > 0) activeInputs.push("image");
    if (websiteData && websiteData.url) activeInputs.push("website content");
    if (smartContextData && smartContextData.context) activeInputs.push("smart context");
    if (selectedPrimary) activeInputs.push(primaryToggles.find(t => t.id === selectedPrimary)?.label?.toLowerCase() || "selected context");
    if (selectedSecondary) activeInputs.push(secondaryToggles.find(t => t.id === selectedSecondary)?.label?.toLowerCase() || "format options");
    
    // Format the loading message based on active inputs
    if (activeInputs.length > 0) {
      loadingMessageText += " with ";
      if (activeInputs.length === 1) {
        loadingMessageText += activeInputs[0];
      } else if (activeInputs.length === 2) {
        loadingMessageText += `${activeInputs[0]} and ${activeInputs[1]}`;
      } else {
        const lastInput = activeInputs.pop();
        loadingMessageText += `${activeInputs.join(', ')}, and ${lastInput}`;
      }
    }
    loadingMessageText += "...";
    
    setCurrentLoadingMessage(loadingMessageText);
    console.log("Set loading message:", loadingMessageText);
    
    try {
      // Prepare payload for analysis with all available inputs
      const payload: any = {
        promptText,
        primaryToggle: selectedPrimary,
        secondaryToggle: selectedSecondary,
        // Track which input types are available
        inputTypes: {
          hasText: promptText.trim().length > 0,
          hasToggles: !!(selectedPrimary || selectedSecondary),
          hasWebscan: !!(websiteData && websiteData.url),
          hasImageScan: !!(images && images.length > 0),
          hasSmartContext: !!(smartContextData && smartContextData.context)
        }
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
        console.log("Including website data in analysis payload");
        payload.websiteData = {
          url: websiteData.url,
          instructions: websiteData.instructions || ""
        };
      }
      
      // Add smart context data if available
      if (smartContextData && smartContextData.context) {
        console.log("Including smart context data in analysis payload");
        payload.smartContextData = {
          context: smartContextData.context,
          usageInstructions: smartContextData.usageInstructions || ""
        };
      }
      
      // Add image data if available - now supports multiple images
      if (images && images.length > 0) {
        payload.imageData = [];
        
        // Process each image (focusing on first image for now due to token limitations)
        const firstImage = images[0];
        try {
          console.log(`Processing image: ${firstImage.file.name}`);
          const base64 = await imageToBase64(firstImage.file);
          payload.imageData.push({ 
            base64,
            filename: firstImage.file.name,
            type: firstImage.file.type,
            context: firstImage.context || ""
          });
          console.log("Image successfully processed and added to payload");
        } catch (error) {
          console.error("Error processing image:", error);
        }
      }
      
      console.log("Sending comprehensive analysis request with all available inputs");
      console.log("Input combination:", Object.entries(payload.inputTypes)
        .filter(([_, value]) => value)
        .map(([key]) => key.replace('has', ''))
        .join(' + ')
      );
      
      const { data, error } = await supabase.functions.invoke('analyze-prompt', {
        body: payload
      });
      
      if (error) throw error;
      
      if (data) {
        console.log("AI analysis response received");
        
        // Check if there was an error in the edge function
        if (data.error) {
          console.warn("Edge function encountered an error:", data.error);
          // Continue processing the fallback data provided
        }
        
        // Process questions with conditional prefilling based on input combination
        if (data.questions && data.questions.length > 0) {
          console.log(`Processing ${data.questions.length} questions from analysis`);
          
          const aiQuestions = data.questions.map((q: any, index: number) => {
            // Determine if this question should be prefilled based on input types
            const shouldPrefill = q.prefillSource ? 
              // Only prefill if the source input is available
              (q.prefillSource === 'webscan' && websiteData && websiteData.url) ||
              (q.prefillSource === 'imagescan' && images && images.length > 0) ||
              (q.prefillSource === 'smartcontext' && smartContextData && smartContextData.context) ||
              (q.prefillSource === 'toggle' && (selectedPrimary || selectedSecondary)) ||
              // If source is combined or not specified, check if we have additional context
              ((q.prefillSource === 'combined' || !q.prefillSource) && 
               ((websiteData && websiteData.url) || 
                (images && images.length > 0) || 
                (smartContextData && smartContextData.context)))
              : false;
            
            return {
              ...q,
              id: q.id || `q${index + 1}`,
              // Only prefill answer if conditions are met
              answer: shouldPrefill && q.answer ? q.answer : "",
              // Mark as relevant if it has an answer and should be prefilled
              isRelevant: shouldPrefill && q.answer && q.answer.trim() !== "" ? true : null
            };
          });
          
          console.log(`Processed questions: ${aiQuestions.length} total, ${aiQuestions.filter(q => q.answer).length} prefilled`);
          setQuestions(aiQuestions);
          setAnalyzedQuestions(aiQuestions);
        } else {
          console.warn("No questions received from analysis, using fallbacks");
          setQuestions(mockQuestions);
          setAnalyzedQuestions(mockQuestions);
        }
        
        // Process variables with similar conditional prefilling logic
        if (data.variables && data.variables.length > 0) {
          console.log(`Processing ${data.variables.length} variables from analysis`);
          
          // Filter and process variables
          const processedVariables = data.variables
            .filter((v: any) => 
              v.name && 
              isValidVariableName(v.name) && 
              v.name !== 'Task' && 
              v.name !== 'Persona' && 
              v.name !== 'Conditions' && 
              v.name !== 'Instructions'
            )
            .map((v: any, index: number) => {
              // Similar prefilling logic for variables
              const shouldPrefill = v.prefillSource ? 
                (v.prefillSource === 'webscan' && websiteData && websiteData.url) ||
                (v.prefillSource === 'imagescan' && images && images.length > 0) ||
                (v.prefillSource === 'smartcontext' && smartContextData && smartContextData.context) ||
                (v.prefillSource === 'toggle' && (selectedPrimary || selectedSecondary)) ||
                ((v.prefillSource === 'combined' || !v.prefillSource) && 
                 ((websiteData && websiteData.url) || 
                  (images && images.length > 0) ||
                  (smartContextData && smartContextData.context)))
                : false;
              
              return {
                ...v,
                id: v.id || `v${index + 1}`,
                // Only prefill value if conditions are met
                value: shouldPrefill && v.value ? v.value : "",
                // Mark as relevant if it has a value and should be prefilled
                isRelevant: shouldPrefill && v.value && v.value.trim() !== "" ? true : null
              };
            });
            
          console.log(`Processed variables: ${processedVariables.length} total, ${processedVariables.filter(v => v.value).length} prefilled`);
          
          // If we have valid variables after filtering, use them
          if (processedVariables.length > 0) {
            setVariables(processedVariables);
            setAnalyzedVariables(processedVariables);
          } else {
            // Otherwise use default variables from constants
            const { defaultVariables } = await import("@/components/dashboard/constants");
            setVariables(defaultVariables);
            setAnalyzedVariables(defaultVariables);
          }
        } else {
          // Use default variables if none provided
          const { defaultVariables } = await import("@/components/dashboard/constants");
          setVariables(defaultVariables);
          setAnalyzedVariables(defaultVariables);
        }
        
        // Set master command and enhanced prompt if available
        if (data.masterCommand) {
          setMasterCommand(data.masterCommand);
        }
        
        if (data.enhancedPrompt) {
          setFinalPrompt(data.enhancedPrompt);
        }
        
        // Log usage statistics if available
        if (data.usage) {
          console.log("Token usage:", data.usage);
          console.log(`Prompt tokens: ${data.usage.prompt_tokens}, Completion tokens: ${data.usage.completion_tokens}`);
        }
      } else {
        console.warn("No data received from analysis function, using fallbacks");
        setQuestions(mockQuestions);
        setAnalyzedQuestions(mockQuestions);
      }
    } catch (error) {
      console.error("Error analyzing prompt with AI:", error);
      toast({
        title: "Analysis Error",
        description: "There was an error analyzing your prompt. Using default questions instead.",
        variant: "destructive",
      });
      setQuestions(mockQuestions);
      setAnalyzedQuestions(mockQuestions);
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
    primaryToggle: string | null,
    secondaryToggle: string | null,
    setFinalPromptFn: React.Dispatch<React.SetStateAction<string>>
  ): Promise<string> => {
    try {
      // Create a context-aware loading message based on toggles
      let message = "Enhancing your prompt";
      if (primaryToggle) {
        const primaryLabel = primaryToggles.find(t => t.id === primaryToggle)?.label || primaryToggle;
        message += ` for ${primaryLabel}`;
        
        if (secondaryToggle) {
          const secondaryLabel = secondaryToggles.find(t => t.id === secondaryToggle)?.label || secondaryToggle;
          message += ` and to be ${secondaryLabel}`;
        }
      } else if (secondaryToggle) {
        const secondaryLabel = secondaryToggles.find(t => t.id === secondaryToggle)?.label || secondaryToggle;
        message += ` to be ${secondaryLabel}`;
      }
      message += " with Aitema X...";
      
      // Set the customized loading message
      setCurrentLoadingMessage(message);
      
      // Filter out only answered and relevant questions
      const answeredQuestions = analyzedQuestions.filter(
        q => q.answer && q.answer.trim() !== "" && q.isRelevant !== false
      );
      
      // Filter out only relevant variables
      const relevantVariables = analyzedVariables.filter(
        v => v.isRelevant === true
      );
      
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: {
          originalPrompt: promptToEnhance,
          answeredQuestions,
          relevantVariables,
          primaryToggle,
          secondaryToggle,
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
      
      // Update the final prompt with the enhanced version
      setFinalPromptFn(data.enhancedPrompt);
      
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
