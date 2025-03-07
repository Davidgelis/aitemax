import { useState, useEffect } from "react";
import { Question, Variable } from "@/components/dashboard/types";
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

  // Extract variables directly from prompt text
  const extractDirectVariables = (text: string): Variable[] => {
    const variables: Variable[] = [];
    const variableRegex = /{{(\w+)}}/g;
    let match;
    
    while ((match = variableRegex.exec(text)) !== null) {
      const name = match[1];
      if (name && 
          name.trim().length > 1 &&
          name !== 'Task' && 
          name !== 'Persona' && 
          name !== 'Conditions' && 
          name !== 'Instructions' && 
          !variables.some(v => v.name === name)) {
        
        const category = name.toLowerCase().includes('recipient') || 
                        name.toLowerCase().includes('audience') || 
                        name.toLowerCase().includes('tone') 
                        ? "Persona" 
                        : name.toLowerCase().includes('count') || 
                          name.toLowerCase().includes('limit') || 
                          name.toLowerCase().includes('time')
                          ? "Conditions"
                          : name.toLowerCase().includes('format') || 
                            name.toLowerCase().includes('style')
                            ? "Instructions"
                            : "Task";
                          
        variables.push({
          id: `v${variables.length + 1}`,
          name,
          value: "",
          isRelevant: true,
          category
        });
      }
    }
    
    return variables;
  };

  const handleAnalyze = async () => {
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
    setCurrentLoadingMessage("Analyzing your prompt...");
    
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

      // Extract direct variables from prompt text to ensure we always have them
      const directVariables = extractDirectVariables(promptText);
      
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
        
        // Prioritize direct variables from the prompt text
        if (directVariables.length > 0) {
          console.log("Using direct variables from prompt:", directVariables);
          setVariables(directVariables);
        } else if (data.variables && data.variables.length > 0) {
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
              value: v.value || "",
              isRelevant: v.isRelevant === null ? true : v.isRelevant
            }));
            
          // If we have valid variables after filtering, use them
          if (validVariables.length > 0) {
            setVariables(validVariables);
          } else {
            // If no variables detected from AI, use direct variables as fallback
            if (directVariables.length > 0) {
              setVariables(directVariables);
            } else {
              // Otherwise use default variables from constants
              const { defaultVariables } = await import("@/components/dashboard/constants");
              setVariables(defaultVariables);
            }
          }
        } else {
          // If no variables detected from AI, use direct variables as fallback
          if (directVariables.length > 0) {
            setVariables(directVariables);
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
        
        // If no data but we have direct variables, use them
        if (directVariables.length > 0) {
          setVariables(directVariables);
        } else {
          const { defaultVariables } = await import("@/components/dashboard/constants");
          setVariables(defaultVariables);
        }
      }
    } catch (error) {
      console.error("Error analyzing prompt with AI:", error);
      toast({
        title: "Analysis Error",
        description: "There was an error analyzing your prompt. Using default questions instead.",
        variant: "destructive",
      });
      setQuestions(mockQuestions);
      
      // If error but we have direct variables, use them
      const directVariables = extractDirectVariables(promptText);
      if (directVariables.length > 0) {
        setVariables(directVariables);
      } else {
        const { defaultVariables } = await import("@/components/dashboard/constants");
        setVariables(defaultVariables);
      }
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
        v => v.isRelevant !== false
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
