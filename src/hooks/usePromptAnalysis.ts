
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
        const aiQuestions = data.questions.map((q: any, index: number) => ({
          ...q,
          id: q.id || `q${index + 1}`,
          answer: ""
        }));
        
        setQuestions(aiQuestions);
        
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
      } else {
        setQuestions(mockQuestions);
      }
    } catch (error) {
      console.error("Error analyzing prompt with AI:", error);
      setQuestions(mockQuestions);
    } finally {
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
