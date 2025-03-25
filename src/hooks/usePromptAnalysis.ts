
import { useState, useCallback } from "react";
import { Question, Variable, UploadedImage } from "@/components/dashboard/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePromptTemplates } from "@/hooks/usePromptTemplates";

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
  currentPromptId: string | null
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState("Analyzing your prompt...");
  const { toast } = useToast();
  const { templates, selectedTemplate, enhancePromptWithTemplate } = usePromptTemplates(user);

  const handleUploadImages = async (images: UploadedImage[]) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images",
        variant: "destructive",
      });
      return [];
    }

    try {
      setIsLoading(true);
      setCurrentLoadingMessage("Uploading images...");

      // Upload images to Supabase storage and get URLs
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const { data, error } = await supabase.storage
            .from("images")
            .upload(`${user.id}/${Date.now()}-${image.file.name}`, image.file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            throw error;
          }

          // Get the public URL correctly without accessing protected properties
          const { data: publicUrlData } = supabase.storage
            .from("images")
            .getPublicUrl(data.path);

          return publicUrlData.publicUrl;
        })
      );

      // Return the URLs of the uploaded images
      return imageUrls;
    } catch (error: any) {
      console.error("Error uploading images:", error.message);
      toast({
        title: "Error uploading images",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanWebsite = async (url: string, instructions: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to scan websites",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setCurrentLoadingMessage("Scanning website...");

      // Call the edge function to scan the website
      const { data, error } = await supabase.functions.invoke('scan-website', {
        body: {
          url,
          instructions,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      // Return the extracted content
      return data;
    } catch (error: any) {
      console.error("Error scanning website:", error.message);
      toast({
        title: "Error scanning website",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = useCallback(async (
    uploadedImages: UploadedImage[] = [],
    websiteContext: { url: string; instructions: string } | null = null,
    smartContext: { context: string; usageInstructions: string } | null = null
  ) => {
    setIsLoading(true);
    setCurrentLoadingMessage("Analyzing your prompt...");

    try {
      const userId = user?.id;

      // Upload images and get URLs
      let imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        imageUrls = await handleUploadImages(uploadedImages);
      }

      // Scan website and get content
      let websiteContent: string | null = null;
      if (websiteContext && websiteContext.url) {
        const websiteData = await handleScanWebsite(websiteContext.url, websiteContext.instructions);
        websiteContent = websiteData?.content || null;
      }

      // Call the edge function to analyze the prompt
      const { data, error } = await supabase.functions.invoke('analyze-prompt', {
        body: {
          promptText,
          imageUrls,
          websiteContent,
          smartContext: smartContext?.context || null,
          smartContextInstructions: smartContext?.usageInstructions || null,
          primaryToggle: selectedPrimary,
          secondaryToggle: selectedSecondary,
          userId,
          promptId: currentPromptId
        }
      });

      if (error) {
        throw error;
      }

      if (data) {
        setQuestions(data.questions || []);
        setVariables(data.variables || []);
        setMasterCommand(data.master_command || "");
        setFinalPrompt(data.final_prompt || "");
        setCurrentStep(2);
      } else {
        throw new Error("Failed to analyze prompt");
      }
    } catch (error: any) {
      console.error("Error analyzing prompt:", error);
      toast({
        title: "Error analyzing prompt",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [promptText, setQuestions, setVariables, setMasterCommand, setFinalPrompt, setCurrentStep, selectedPrimary, selectedSecondary, user, currentPromptId, handleUploadImages, handleScanWebsite, toast]);

  const enhancePromptWithGPT = async (
    originalPrompt: string,
    primaryToggle: string | null = null,
    secondaryToggle: string | null = null,
    setFinalPrompt: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setIsLoading(true);
    setCurrentLoadingMessage(`Enhancing prompt${primaryToggle ? ` for ${primaryToggle}` : ''}...`);
    
    try {
      const userId = user?.id;
      const answeredQuestions = [];
      
      // Check if we should use the template system
      if (selectedTemplate && selectedTemplate.id) {
        const result = await enhancePromptWithTemplate(
          originalPrompt,
          answeredQuestions,
          selectedTemplate.id
        );
        
        if (result && result.enhancedPrompt) {
          setFinalPrompt(result.enhancedPrompt);
          return result.enhancedPrompt;
        } else {
          throw new Error(result?.error || "Failed to enhance prompt with template");
        }
      } else {
        // Fall back to the original function
        const { data, error } = await supabase.functions.invoke('enhance-prompt', {
          body: {
            originalPrompt,
            answeredQuestions: [],
            relevantVariables: [],
            primaryToggle,
            secondaryToggle,
            userId,
            promptId: currentPromptId
          }
        });

        if (error) {
          console.error("Error enhancing prompt:", error);
          throw error;
        }

        if (data && data.enhancedPrompt) {
          setFinalPrompt(data.enhancedPrompt);
          return data.enhancedPrompt;
        } else {
          throw new Error("Failed to enhance prompt");
        }
      }
    } catch (error: any) {
      console.error("Error in enhancePromptWithGPT:", error);
      toast({
        title: "Error enhancing prompt",
        description: error.message,
        variant: "destructive"
      });
      setFinalPrompt(originalPrompt);
      return originalPrompt;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    currentLoadingMessage,
    handleAnalyze,
    enhancePromptWithGPT,
    uploadImages: handleUploadImages,
    scanWebsite: handleScanWebsite
  };
};
