
import { useState, useCallback } from 'react';
import { Question, Variable } from '@/components/dashboard/types';
import { supabase } from '@/integrations/supabase/client';

export const usePromptAnalysis = (
  promptText: string,
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>,
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>,
  setMasterCommand: React.Dispatch<React.SetStateAction<string>>,
  setFinalPrompt: React.Dispatch<React.SetStateAction<string>>,
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>,
  selectedPrimary: string | null,
  selectedSecondary: string | null,
  user: any,
  currentPromptId: string | null = null,
  selectedTemplateId: string | null = null
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('Analyzing your prompt...');

  const handleAnalyze = useCallback(async (
    uploadedImages = [],
    websiteContext = null,
    smartContext = null,
  ) => {
    if (!promptText.trim()) {
      alert('Please enter a prompt to analyze');
      return;
    }

    setIsLoading(true);
    setCurrentLoadingMessage('Analyzing your prompt...');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-prompt', {
        body: {
          prompt: promptText,
          userId: user?.id,
          promptId: currentPromptId,
          websiteContext,
          smartContext,
          images: uploadedImages.map(img => ({
            id: img.id,
            url: img.url,
            context: img.context
          }))
        }
      });

      if (error) {
        throw new Error(`Error analyzing prompt: ${error.message}`);
      }

      if (data) {
        setQuestions(data.questions || []);
        setVariables(data.variables || []);
        setMasterCommand(data.masterCommand || '');
        setCurrentStep(2);
      } else {
        throw new Error('No data received from prompt analysis');
      }
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      setQuestions([]);
      setVariables([]);
      setMasterCommand('');
      alert(`Error analyzing prompt: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [promptText, user, currentPromptId, setQuestions, setVariables, setMasterCommand, setCurrentStep]);

  const enhancePromptWithGPT = useCallback(async (
    prompt: string,
    primaryToggle: string | null,
    secondaryToggle: string | null,
    setFinalPrompt: React.Dispatch<React.SetStateAction<string>>,
    templateId: string | null = null
  ) => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setCurrentLoadingMessage('Enhancing your prompt with o3-mini...');

    try {
      // Send only answered questions
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: {
          originalPrompt: prompt,
          answeredQuestions: [], // We no longer send questions
          relevantVariables: [], // We no longer send variables
          primaryToggle,
          secondaryToggle,
          userId: user?.id,
          promptId: currentPromptId,
          templateId // Pass the template ID to use for prompt enhancement
        }
      });

      if (error) {
        throw new Error(`Error enhancing prompt: ${error.message}`);
      }

      if (data && data.enhancedPrompt) {
        setFinalPrompt(data.enhancedPrompt);
      } else {
        throw new Error('No enhanced prompt data received');
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      setFinalPrompt(prompt); // Use original prompt as fallback
    } finally {
      setIsLoading(false);
    }
  }, [user, currentPromptId, setIsLoading, setCurrentLoadingMessage]);

  return { 
    isLoading, 
    currentLoadingMessage, 
    handleAnalyze,
    enhancePromptWithGPT
  };
};
