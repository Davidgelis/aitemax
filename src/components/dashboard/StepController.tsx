
import React, { useState, useCallback } from "react";
import { StepOneContent } from "@/components/dashboard/StepOneContent";
import { StepTwoContent } from "@/components/dashboard/StepTwoContent";
import { StepThreeContent } from "@/components/dashboard/StepThreeContent";
import { StepIndicator } from "@/components/dashboard/StepIndicator";
import { AIModel, UploadedImage } from "@/components/dashboard/types";
import { useResponsive } from "@/hooks/useResponsive";

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
  const { isMobile } = useResponsive();

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
    console.log("StepController: handleAnalyze called");
    setIsAnalyzing(true);
    
    try {
      // Check if the promptAnalyzer exists in promptState
      if (promptState.promptAnalyzer && typeof promptState.promptAnalyzer.handleAnalyze === 'function') {
        console.log("Using prompt analyzer for analysis");
        await promptState.promptAnalyzer.handleAnalyze(uploadedImages, websiteContext, smartContext);
      } else {
        console.log("Analyzer not available, directly setting to step 2");
        promptState.setCurrentStep(2);
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      // Fallback to step 2 even if there's an error
      promptState.setCurrentStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    promptState, 
    uploadedImages, 
    websiteContext, 
    smartContext
  ]);

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

  const handleStepChange = (step: number) => {
    promptState.setCurrentStep(step);
  };

  return (
    <div className="flex flex-col w-full">
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
            variables={promptState.variables}
            onQuestionRelevance={(questionId, isRelevant) => {
              promptState.setQuestions(prevQuestions =>
                prevQuestions.map(q => q.id === questionId ? { ...q, isRelevant } : q)
              );
            }}
            onQuestionAnswer={(questionId, answer) => {
              promptState.setQuestions(prevQuestions =>
                prevQuestions.map(q => q.id === questionId ? { ...q, answer } : q)
              );
            }}
            onVariableChange={(variableId, field, content) => {
              promptState.setVariables(prevVariables =>
                prevVariables.map(v => v.id === variableId ? { ...v, [field]: content } : v)
              );
            }}
            onVariableRelevance={(variableId, isRelevant) => {
              promptState.setVariables(prevVariables =>
                prevVariables.map(v => v.id === variableId ? { ...v, isRelevant } : v)
              );
            }}
            onAddVariable={promptState.addVariable}
            onDeleteVariable={promptState.deleteVariable}
            variableToDelete={promptState.variableToDelete}
            setVariableToDelete={promptState.setVariableToDelete}
            canProceedToStep3={true}
            onContinue={() => promptState.setCurrentStep(3)}
            questionsContainerRef={promptState.questionsContainerRef}
            variablesContainerRef={promptState.variablesContainerRef}
            originalPrompt={promptState.promptText}
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
      
      <StepIndicator 
        currentStep={promptState.currentStep} 
        onStepChange={handleStepChange}
        isViewingSavedPrompt={promptState.isViewingSavedPrompt}
      />
    </div>
  );
};
