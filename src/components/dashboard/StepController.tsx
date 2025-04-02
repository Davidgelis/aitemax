import { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { StepIndicator } from "@/components/dashboard/StepIndicator";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { StepOneContent } from "@/components/dashboard/StepOneContent";
import { StepTwoContent } from "@/components/dashboard/StepTwoContent";
import { StepThreeContent } from "@/components/dashboard/StepThreeContent";
import { PrivacyNoticePopup } from "@/components/dashboard/PrivacyNoticePopup";
import { usePromptAnalysis } from "@/hooks/usePromptAnalysis";
import { useQuestionsAndVariables } from "@/hooks/useQuestionsAndVariables";
import { usePromptOperations } from "@/hooks/usePromptOperations";
import { AIModel, UploadedImage } from "@/components/dashboard/types";
import { primaryToggles, secondaryToggles } from "./constants";

interface StepControllerProps {
  user: any;
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel | null) => void;
  isInitializingModels?: boolean;
  promptState: any;
}

export const StepController = ({ 
  user,
  selectedModel,
  setSelectedModel,
  isInitializingModels = false,
  promptState
}: StepControllerProps) => {
  
  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const variablesContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  
  const {
    promptText, setPromptText,
    questions, setQuestions,
    variables, setVariables,
    showJson, setShowJson,
    finalPrompt, setFinalPrompt,
    editingPrompt, setEditingPrompt,
    showEditPromptSheet, setShowEditPromptSheet,
    masterCommand, setMasterCommand,
    selectedPrimary, setSelectedPrimary,
    selectedSecondary, setSelectedSecondary,
    currentStep, setCurrentStep,
    savedPrompts, isLoadingPrompts, searchTerm, setSearchTerm,
    variableToDelete, setVariableToDelete,
    fetchSavedPrompts, handleNewPrompt, handleSavePrompt,
    handleDeletePrompt, handleDuplicatePrompt, handleRenamePrompt,
    loadSavedPrompt, isViewingSavedPrompt, setIsViewingSavedPrompt,
    saveDraft
  } = promptState;
  
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [enhancingMessage, setEnhancingMessage] = useState("Enhancing your prompt with o3-mini...");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [websiteContext, setWebsiteContext] = useState<{ url: string; instructions: string } | null>(null);
  const [smartContext, setSmartContext] = useState<{ context: string; usageInstructions: string } | null>(null);
  const [shouldAnalyzeAfterContextChange, setShouldAnalyzeAfterContextChange] = useState(false);
  const [preventStepChange, setPreventStepChange] = useState(false);
  
  const currentPromptId = isViewingSavedPrompt && savedPrompts && savedPrompts.length > 0
    ? savedPrompts.find(p => p.promptText === promptText)?.id || null
    : null;
  
  const promptAnalysis = usePromptAnalysis(
    promptText,
    setQuestions,
    setVariables,
    setMasterCommand,
    setFinalPrompt,
    setCurrentStep,
    selectedPrimary,
    selectedSecondary,
    user,
    currentPromptId
  );
  
  const { isLoading: isAnalyzing, currentLoadingMessage, handleAnalyze } = promptAnalysis;
  
  const questionVarOps = useQuestionsAndVariables(
    questions,
    setQuestions,
    variables,
    setVariables,
    variableToDelete,
    setVariableToDelete,
    user,
    currentPromptId
  );
  
  const {
    handleQuestionAnswer,
    handleQuestionRelevance,
    handleVariableChange,
    handleVariableRelevance,
    addVariable,
    removeVariable,
    canProceedToStep3,
    enhancePromptWithGPT,
    isEnhancing
  } = questionVarOps;
  
  const promptOperations = usePromptOperations(
    variables,
    setVariables,
    finalPrompt,
    setFinalPrompt, 
    showJson,
    setEditingPrompt,
    setShowEditPromptSheet,
    masterCommand,
    editingPrompt
  );
  
  const {
    getProcessedPrompt,
    handleVariableValueChange,
    handleOpenEditPrompt,
    handleSaveEditedPrompt,
    handleAdaptPrompt,
    handleCopyPrompt,
    handleRegenerate
  } = promptOperations;
  
  useEffect(() => {
    if (user) {
      fetchSavedPrompts();
    }
  }, [user]);

  const handlePrimaryToggle = (id: string) => {
    setSelectedPrimary(currentSelected => currentSelected === id ? null : id);
  };

  const handleSecondaryToggle = (id: string) => {
    setSelectedSecondary(currentSelected => currentSelected === id ? null : id);
  };

  const handleWebsiteScan = (url: string, instructions: string) => {
    console.log("StepController: Website context set:", { url, instructions });
    setWebsiteContext({ url, instructions });
  };

  const handleImagesChange = (images: UploadedImage[]) => {
    console.log("StepController: Images updated:", images);
    setUploadedImages(images);
    // Don't automatically analyze when images change - let the user explicitly trigger analysis
  };

  const handleSmartContext = (context: string, usageInstructions: string) => {
    console.log("StepController: Smart context set:", { 
      context: context.substring(0, 100) + (context.length > 100 ? "..." : ""),
      usageInstructions: usageInstructions.substring(0, 100) + (usageInstructions.length > 100 ? "..." : "")
    });
    setSmartContext({ context, usageInstructions });
  };

  const handleAnalyzeWithContext = () => {
    // Only proceed with analysis if we're on step 1
    if (currentStep !== 1) {
      console.log("StepController: Not on step 1, not analyzing");
      return;
    }
    
    // If we're currently in a context dialog operation that should prevent step change
    if (preventStepChange) {
      console.log("StepController: Step change prevented due to context operation");
      setPreventStepChange(false);
      return;
    }
    
    console.log("StepController: Analyzing with context", {
      imagesCount: uploadedImages?.length || 0,
      hasWebsiteContext: !!websiteContext && !!websiteContext.url,
      hasSmartContext: !!smartContext && !!smartContext.context,
      websiteUrl: websiteContext?.url || "none",
      websiteInstructions: websiteContext?.instructions || "none"
    });
    
    // Ensure we're passing valid values to handleAnalyze
    const validImages = Array.isArray(uploadedImages) && uploadedImages.length > 0 ? uploadedImages : null;
    const validWebsiteContext = websiteContext && websiteContext.url ? websiteContext : null;
    const validSmartContext = smartContext && smartContext.context ? smartContext : null;
    
    handleAnalyze(validImages, validWebsiteContext, validSmartContext);
  };

  const handleStepChange = async (step: number, bypass: boolean = false) => {
    // If we're currently in a context dialog operation that should prevent step change
    if (preventStepChange && !bypass) {
      console.log("StepController: Step change prevented due to context operation");
      setPreventStepChange(false);
      return;
    }
    
    if (isViewingSavedPrompt && step !== 3) {
      return;
    }
    
    if (bypass) {
      setCurrentStep(step);
      return;
    }

    if (step === 2 && !promptText.trim()) {
      toast({
        title: "Cannot proceed",
        description: "Please enter a prompt before moving to step 2",
        variant: "destructive",
      });
      return;
    }

    if (step === 2 && questions.length === 0) {
      toast({
        title: "Cannot proceed",
        description: "Please analyze your prompt first",
        variant: "destructive",
      });
      return;
    }

    // Save draft only when moving from step 1 to step 2
    // Not when moving to step 3
    if (step === 2 && currentStep === 1 && user && !isViewingSavedPrompt) {
      saveDraft();
    }

    if (step === 3) {
      // When moving to step 3, don't save draft
      setIsEnhancingPrompt(true);
      
      // Update enhancement message based on toggles
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
      message += " with o3-mini...";
      
      setEnhancingMessage(message);
      
      try {
        console.log("StepController: Enhancing prompt for step 3 with o3-mini...");
        
        // Get the selected template from window object
        // @ts-ignore
        const selectedTemplate = window.__selectedTemplate || null;
        
        console.log("StepController: Using template for enhancement:", 
          selectedTemplate ? {
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            pillars: selectedTemplate.pillars?.map((p: any) => p.title) || []
          } : "No template");
        
        // Ensure we make a clean copy of the template to avoid reference issues
        const templateCopy = selectedTemplate ? JSON.parse(JSON.stringify(selectedTemplate)) : null;
        
        // Use the enhancePromptWithGPT function to get an enhanced prompt
        // Make sure we're also passing the answers to questions and relevant variables
        const answeredQuestions = questions.filter(q => q.isRelevant !== false && q.answer?.trim());
        const relevantVariables = variables.filter(v => v.isRelevant === true);
        
        console.log("StepController: Enhancing with:", {
          answeredQuestionsCount: answeredQuestions.length,
          relevantVariablesCount: relevantVariables.length,
          templateName: templateCopy?.name || "No template"
        });
        
        // Call the edge function directly rather than using the hook method
        await promptAnalysis.enhancePromptWithGPT(
          promptText,
          selectedPrimary,
          selectedSecondary,
          setFinalPrompt,
          answeredQuestions,
          relevantVariables,
          templateCopy  // Pass the clean template copy
        );
        
        console.log("StepController: Successfully enhanced prompt, moving to step 3");
        setCurrentStep(step);
      } catch (error) {
        console.error("StepController: Error enhancing prompt:", error);
        
        // Still allow user to proceed to step 3 with a fallback message
        toast({
          title: "Warning",
          description: "There was an issue enhancing your prompt, but you can still proceed with the original text.",
          variant: "default", // Changed from "warning" to "default"
        });
        
        setCurrentStep(step);
      } finally {
        setIsEnhancingPrompt(false);
      }
      
      return;
    }

    setCurrentStep(step);
  };

  const handleDirectJump = (step: number) => {
    if (isViewingSavedPrompt && step !== 3) {
      return;
    }
    
    handleStepChange(step, true);
  };

  const filteredPrompts = savedPrompts.filter(prompt => 
    searchTerm === "" || 
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.promptText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (isAnalyzing || isEnhancingPrompt || isEnhancing) {
      let message = isEnhancingPrompt 
        ? enhancingMessage
        : isEnhancing
          ? currentLoadingMessage
          : currentLoadingMessage;
          
      return <LoadingState currentLoadingMessage={message} />;
    }

    switch (currentStep) {
      case 1:
        return (
          <StepOneContent
            promptText={promptText}
            setPromptText={setPromptText}
            selectedPrimary={selectedPrimary}
            selectedSecondary={selectedSecondary}
            handlePrimaryToggle={handlePrimaryToggle}
            handleSecondaryToggle={handleSecondaryToggle}
            onAnalyze={handleAnalyzeWithContext}
            isLoading={isAnalyzing}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedCognitive={null}
            handleCognitiveToggle={() => {}}
            onImagesChange={handleImagesChange}
            onWebsiteScan={handleWebsiteScan}
            onSmartContext={handleSmartContext}
            setPreventStepChange={setPreventStepChange}
          />
        );

      case 2:
        return (
          <StepTwoContent
            questions={questions}
            variables={variables}
            onQuestionRelevance={handleQuestionRelevance}
            onQuestionAnswer={handleQuestionAnswer}
            onVariableChange={handleVariableChange}
            onVariableRelevance={handleVariableRelevance}
            onAddVariable={addVariable}
            onDeleteVariable={removeVariable}
            variableToDelete={variableToDelete}
            setVariableToDelete={setVariableToDelete}
            canProceedToStep3={canProceedToStep3()}
            onContinue={() => handleStepChange(3)}
            questionsContainerRef={questionsContainerRef}
            variablesContainerRef={variablesContainerRef}
            originalPrompt={promptText}
          />
        );

      case 3:
        return (
          <StepThreeContent 
            masterCommand={masterCommand}
            setMasterCommand={setMasterCommand}
            selectedPrimary={selectedPrimary}
            selectedSecondary={selectedSecondary}
            handlePrimaryToggle={handlePrimaryToggle}
            handleSecondaryToggle={handleSecondaryToggle}
            showJson={showJson}
            setShowJson={setShowJson}
            finalPrompt={finalPrompt}
            setFinalPrompt={setFinalPrompt} // Pass the setFinalPrompt function explicitly
            variables={variables}
            setVariables={setVariables}
            handleVariableValueChange={handleVariableValueChange}
            handleCopyPrompt={handleCopyPrompt}
            handleSavePrompt={handleSavePrompt}
            handleRegenerate={handleRegenerate}
            editingPrompt={editingPrompt}
            setEditingPrompt={setEditingPrompt}
            showEditPromptSheet={showEditPromptSheet}
            setShowEditPromptSheet={setShowEditPromptSheet}
            handleOpenEditPrompt={handleOpenEditPrompt}
            handleSaveEditedPrompt={handleSaveEditedPrompt}
            handleAdaptPrompt={handleAdaptPrompt}
            getProcessedPrompt={getProcessedPrompt}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
      
      <StepIndicator 
        currentStep={currentStep} 
        onStepChange={handleDirectJump} 
        isViewingSavedPrompt={isViewingSavedPrompt}
      />
      
      <PrivacyNoticePopup user={user} currentStep={currentStep} />
    </div>
  );
};
