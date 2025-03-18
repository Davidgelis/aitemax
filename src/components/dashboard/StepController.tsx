import React, { useState, useCallback } from "react";
import { StepOneContent } from "@/components/dashboard/StepOneContent";
import { StepTwoContent } from "@/components/dashboard/StepTwoContent";
import { StepThreeContent } from "@/components/dashboard/StepThreeContent";
import { StepIndicator } from "@/components/dashboard/StepIndicator";
import { AIModel, UploadedImage } from "@/components/dashboard/types";

interface StepControllerProps {
  user: any;
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel | null) => void;
  promptState: any;
}

export const StepController: React.FC<StepControllerProps> = ({ 
  user, 
  selectedModel, 
  setSelectedModel,
  promptState 
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [websiteContext, setWebsiteContext] = useState<{ url: string; instructions: string } | null>(null);
  const [smartContext, setSmartContext] = useState<{ context: string; usageInstructions: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCognitive, setSelectedCognitive] = useState<string | null>(null);

  const handlePrimaryToggle = (id: string) => {
    promptState.setSelectedPrimary(promptState.selectedPrimary === id ? null : id);
  };

  const handleSecondaryToggle = (id: string) => {
    promptState.setSelectedSecondary(promptState.selectedSecondary === id ? null : id);
  };

  const handleCognitiveToggle = (id: string) => {
    setSelectedCognitive(selectedCognitive === id ? null : id);
  };

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      promptState.setCurrentStep(2);
    } catch (error) {
      console.error("Error during analysis:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [promptState]);

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    console.log("StepController: Images updated:", images);
  };

  const handleWebsiteScan = (url: string, instructions: string = "") => {
    const contextData = { url, instructions };
    setWebsiteContext(contextData);
    console.log("StepController: Website context set:", contextData);
  };

  const handleSmartContext = (context: string, usageInstructions: string = "") => {
    const contextData = { context, usageInstructions };
    setSmartContext(contextData);
    console.log("StepController: Smart context set:", {
      context: context.substring(0, 100) + (context.length > 100 ? "..." : ""),
      usageInstructions: usageInstructions.substring(0, 100) + (usageInstructions.length > 100 ? "..." : "")
    });
  };

  return (
    <div className="flex flex-col w-full">
      <StepIndicator currentStep={promptState.currentStep} />
      
      <div className="mt-4">
        {promptState.currentStep === 1 && (
          <StepOneContent 
            promptText={promptState.promptText}
            setPromptText={promptState.setPromptText}
            selectedPrimary={promptState.selectedPrimary}
            selectedSecondary={promptState.selectedSecondary}
            handlePrimaryToggle={handlePrimaryToggle}
            handleSecondaryToggle={handleSecondaryToggle}
            onAnalyze={handleAnalyze}
            isLoading={isAnalyzing}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedCognitive={selectedCognitive}
            handleCognitiveToggle={handleCognitiveToggle}
            onImagesChange={handleImagesChange}
            onWebsiteScan={handleWebsiteScan}
            onSmartContext={handleSmartContext}
            isPrivate={promptState.isPrivate}
            setIsPrivate={promptState.setIsPrivate}
          />
        )}
        
        {promptState.currentStep === 2 && (
          <StepTwoContent
            questions={promptState.questions}
            setQuestions={promptState.setQuestions}
            currentQuestionPage={promptState.currentQuestionPage}
            setCurrentQuestionPage={promptState.setCurrentQuestionPage}
            variables={promptState.variables}
            setVariables={promptState.setVariables}
            handleVariableValueChange={(id, value) => {
              promptState.setVariables(prevVariables =>
                prevVariables.map(variable =>
                  variable.id === id ? { ...variable, value } : variable
                )
              );
            }}
            onNext={() => promptState.setCurrentQuestionPage(prev => prev + 1)}
            onPrev={() => promptState.setCurrentQuestionPage(prev => prev - 1)}
            onGenerate={() => promptState.setCurrentStep(3)}
          />
        )}
        
        {promptState.currentStep === 3 && (
          <StepThreeContent
            masterCommand={promptState.masterCommand}
            setMasterCommand={promptState.setMasterCommand}
            selectedPrimary={promptState.selectedPrimary}
            selectedSecondary={promptState.selectedSecondary}
            handlePrimaryToggle={handlePrimaryToggle}
            handleSecondaryToggle={handleSecondaryToggle}
            showJson={promptState.showJson}
            setShowJson={promptState.setShowJson}
            finalPrompt={promptState.finalPrompt}
            setFinalPrompt={promptState.setFinalPrompt}
            variables={promptState.variables}
            setVariables={promptState.setVariables}
            handleVariableValueChange={(id, value) => {
              promptState.setVariables(prevVariables =>
                prevVariables.map(variable =>
                  variable.id === id ? { ...variable, value } : variable
                )
              );
            }}
            handleCopyPrompt={() => {}}
            handleSavePrompt={promptState.handleSavePrompt}
            handleRegenerate={handleAnalyze}
            editingPrompt={promptState.editingPrompt}
            setEditingPrompt={promptState.setEditingPrompt}
            showEditPromptSheet={promptState.showEditPromptSheet}
            setShowEditPromptSheet={promptState.setShowEditPromptSheet}
            handleOpenEditPrompt={() => {
              promptState.setEditingPrompt(promptState.finalPrompt);
              promptState.setShowEditPromptSheet(true);
            }}
            handleSaveEditedPrompt={() => {
              promptState.setFinalPrompt(promptState.editingPrompt);
              promptState.setShowEditPromptSheet(false);
            }}
            handleAdaptPrompt={(prompt: string) => {
              promptState.setFinalPrompt(prompt);
            }}
            getProcessedPrompt={() => promptState.finalPrompt}
            isPrivate={promptState.isPrivate}
            setIsPrivate={promptState.setIsPrivate}
          />
        )}
      </div>
    </div>
  );
};
