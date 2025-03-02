
import { useState, useEffect } from "react";
import { Question, Variable } from "@/components/dashboard/types";
import { loadingMessages, mockQuestions } from "@/components/dashboard/constants";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const usePromptAnalysis = (
  promptText: string,
  setQuestions: (questions: Question[]) => void,
  setVariables: (variables: Variable[]) => void,
  setMasterCommand: (command: string) => void,
  setFinalPrompt: (prompt: string) => void,
  setCurrentStep: (step: number) => void,
  selectedPrimary: string | null,
  selectedSecondary: string | null,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      if (currentLoadingMessage < loadingMessages.length) {
        timeout = setTimeout(() => {
          setCurrentLoadingMessage(prev => prev + 1);
        }, 3000);
      } else {
        setIsLoading(false);
        setCurrentLoadingMessage(0);
        setCurrentStep(2);
      }
    }
    return () => clearTimeout(timeout);
  }, [isLoading, currentLoadingMessage, setCurrentStep]);

  const handleAnalyze = async () => {
    if (!promptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt before analyzing",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-prompt', {
        body: {
          promptText,
          primaryToggle: selectedPrimary,
          secondaryToggle: selectedSecondary
        }
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
          const aiVariables = data.variables.map((v: any, index: number) => ({
            ...v,
            id: v.id || `v${index + 1}`,
            value: v.value || ""
          }));
          setVariables(aiVariables);
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
      // Use a timer to show loading messages for a few seconds
      // instead of immediately finishing the loading state
      setTimeout(() => {
        setIsLoading(false);
        setCurrentLoadingMessage(0);
        setCurrentStep(2);
      }, 3000);
    }
  };

  return {
    isLoading,
    currentLoadingMessage,
    handleAnalyze
  };
};
