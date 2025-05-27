
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PromptAnalysis {
  questions: Array<{
    id: string;
    question: string;
    category: string;
    isAnswered: boolean;
    answer?: string;
  }>;
  variables: Array<{
    id: string;
    name: string;
    description: string;
    placeholder: string;
    value: string;
  }>;
  tags: string[];
  isLoading: boolean;
  error: string | null;
}

export const usePromptAnalysis = (
  promptText: string,
  setQuestions?: (questions: any[]) => void,
  setVariables?: (variables: any[]) => void,
  setMasterCommand?: (command: string) => void,
  setFinalPrompt?: (prompt: string) => void,
  jumpToStep?: (step: number) => void,
  user?: any,
  currentPromptId?: string | null,
  setAnalysisWarnings?: (warnings: string[]) => void
) => {
  const [analysis, setAnalysis] = useState<PromptAnalysis>({
    questions: [],
    variables: [],
    tags: [],
    isLoading: false,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('');
  const [loadingState, setLoadingState] = useState<{ message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const analyzePrompt = async (text: string) => {
    if (!text.trim()) {
      setAnalysis(prev => ({ ...prev, questions: [], variables: [], tags: [], isLoading: false, error: null }));
      return;
    }

    setAnalysis(prev => ({ ...prev, isLoading: true, error: null }));
    setIsLoading(true);
    setCurrentLoadingMessage('Analyzing your prompt...');
    setLoadingState({ message: 'Analyzing your prompt...' });

    try {
      console.log('Analyzing prompt:', text.substring(0, 100) + '...');
      
      const { data, error } = await supabase.functions.invoke('analyze-prompt', {
        body: { prompt: text }
      });

      if (error) throw error;

      const newAnalysis = {
        questions: data.questions || [],
        variables: data.variables || [],
        tags: data.tags || [],
        isLoading: false,
        error: null
      };

      setAnalysis(newAnalysis);

      // Update external state if callbacks provided
      if (setQuestions) setQuestions(newAnalysis.questions);
      if (setVariables) setVariables(newAnalysis.variables);
      if (jumpToStep) jumpToStep(2);

    } catch (error: any) {
      console.error('Prompt analysis error:', error);
      const errorMessage = error.message || 'Failed to analyze prompt';
      
      setAnalysis(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      if (setAnalysisWarnings) {
        setAnalysisWarnings([errorMessage]);
      }

      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
      setLoadingState(null);
    }
  };

  const handleAnalyze = async (
    images?: any[] | null,
    websiteContext?: any | null,
    smartContext?: any | null
  ) => {
    await analyzePrompt(promptText);
  };

  const enhancePromptWithGPT = async (
    promptText: string,
    selectedPrimary: string | null,
    selectedSecondary: string | null,
    setFinalPrompt: (prompt: string) => void,
    answeredQuestions: any[],
    relevantVariables: any[],
    template: any
  ) => {
    setIsLoading(true);
    setCurrentLoadingMessage('Enhancing prompt with AI...');
    
    try {
      // Simple enhancement for now
      const enhanced = `Enhanced: ${promptText}`;
      setFinalPrompt(enhanced);
    } catch (error) {
      console.error('Enhancement error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      analyzePrompt(promptText);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [promptText]);

  return { 
    analysis, 
    analyzePrompt,
    isLoading,
    currentLoadingMessage,
    loadingState,
    handleAnalyze,
    enhancePromptWithGPT,
    retryCount
  };
};
