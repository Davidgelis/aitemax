
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { PromptTemplate, UploadedImage } from '@/components/dashboard/types';

export const usePromptAnalysis = (
  promptText: string,
  setQuestions: (questions: any[]) => void,
  setVariables: (variables: any[]) => void, 
  setMasterCommand: (masterCommand: string) => void,
  setFinalPrompt: (finalPrompt: string) => void,
  setCurrentStep: (step: number) => void,
  selectedPrimary: string | null,
  selectedSecondary: string | null,
  user: any,
  promptId: string | null = null
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('Analyzing prompt...');
  const { toast } = useToast();

  // Analyze the prompt and extract questions and variables
  const handleAnalyze = async (
    uploadedImages: UploadedImage[] = [], 
    websiteContext: { url: string; instructions: string } | null = null,
    smartContext: { context: string; usageInstructions: string } | null = null,
    selectedTemplate: PromptTemplate | null = null
  ) => {
    if (!promptText.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Please enter a prompt to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCurrentLoadingMessage('Analyzing prompt...');

    try {
      // Prepare the payload
      const payload = {
        prompt: promptText,
        userId: user?.id || null,
        promptId,
        images: uploadedImages,
        websiteContext,
        smartContext
      };

      // Call the edge function
      const response = await supabase.functions.invoke('analyze-prompt', {
        body: payload
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error analyzing prompt');
      }

      // Update the state with the response data
      const { 
        questions = [], 
        variables = [], 
        masterCommand = '',
        enhancedPrompt = ''
      } = response.data || {};

      setQuestions(questions);
      setVariables(variables);
      setMasterCommand(masterCommand);
      
      // If there's already an enhanced prompt, set it
      if (enhancedPrompt) {
        setFinalPrompt(enhancedPrompt);
      }

      // Move to step 2
      setCurrentStep(2);

    } catch (error: any) {
      console.error('Error analyzing prompt:', error);
      toast({
        title: "Error analyzing prompt",
        description: error.message || 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhance the prompt with GPT for step 3
  const enhancePromptWithGPT = async (
    promptToEnhance: string,
    primaryToggle: string | null,
    secondaryToggle: string | null,
    setEnhancedPrompt: (prompt: string) => void,
    selectedTemplate: PromptTemplate | null = null
  ) => {
    if (!promptToEnhance.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Please enter a prompt to enhance",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCurrentLoadingMessage(`Enhancing prompt${primaryToggle ? ` for ${primaryToggle}` : ''}${selectedTemplate ? ` using ${selectedTemplate.title} template` : ''}...`);

    try {
      // Get all questions with answers
      const answeredQuestions = await supabase.functions.invoke('enhance-prompt', {
        body: {
          originalPrompt: promptToEnhance,
          answeredQuestions: [], // We don't have questions with answers at this point
          relevantVariables: [], // We don't have variables at this point
          primaryToggle,
          secondaryToggle,
          userId: user?.id || null,
          promptId,
          selectedTemplate
        }
      });

      if (answeredQuestions.error) {
        throw new Error(answeredQuestions.error.message || 'Error enhancing prompt');
      }

      // Get the enhanced prompt
      const { enhancedPrompt, loadingMessage } = answeredQuestions.data || {};
      
      if (loadingMessage) {
        setCurrentLoadingMessage(loadingMessage);
      }

      if (enhancedPrompt) {
        setEnhancedPrompt(enhancedPrompt);
      } else {
        // If no enhanced prompt is returned, use the original
        setEnhancedPrompt(promptToEnhance);
        toast({
          title: "Warning",
          description: "Could not enhance the prompt. Using original prompt instead.",
          variant: "default",
        });
      }

    } catch (error: any) {
      console.error('Error enhancing prompt:', error);
      toast({
        title: "Error enhancing prompt",
        description: error.message || 'Something went wrong',
        variant: "destructive",
      });
      
      // Use the original prompt as a fallback
      setEnhancedPrompt(promptToEnhance);
      
      throw error; // Re-throw to allow calling code to handle the error
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    currentLoadingMessage,
    handleAnalyze,
    enhancePromptWithGPT
  };
};

