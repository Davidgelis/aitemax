
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

export const usePromptAnalysis = (promptText: string) => {
  const [analysis, setAnalysis] = useState<PromptAnalysis>({
    questions: [],
    variables: [],
    tags: [],
    isLoading: false,
    error: null,
  });

  const analyzePrompt = async (text: string) => {
    if (!text.trim()) {
      setAnalysis(prev => ({ ...prev, questions: [], variables: [], tags: [], isLoading: false, error: null }));
      return;
    }

    setAnalysis(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Analyzing prompt:', text.substring(0, 100) + '...');
      
      const { data, error } = await supabase.functions.invoke('analyze-prompt', {
        body: { prompt: text }
      });

      if (error) throw error;

      setAnalysis(prev => ({
        ...prev,
        questions: data.questions || [],
        variables: data.variables || [],
        tags: data.tags || [],
        isLoading: false
      }));

    } catch (error: any) {
      console.error('Prompt analysis error:', error);
      setAnalysis(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to analyze prompt'
      }));
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      analyzePrompt(promptText);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [promptText]);

  return { analysis, analyzePrompt };
};
