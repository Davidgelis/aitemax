import { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { StepIndicator } from "@/components/dashboard/StepIndicator";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { StepOneContent } from "@/components/dashboard/StepOneContent";
import { StepTwoContent } from "@/components/dashboard/StepTwoContent";
import { StepThreeContent } from "@/components/dashboard/StepThreeContent";
import { usePromptAnalysis } from "@/hooks/usePromptAnalysis";
import { useQuestionsAndVariables } from "@/hooks/useQuestionsAndVariables";
import { usePromptOperations } from "@/hooks/usePromptOperations";
import { AIModel } from "@/components/dashboard/types";
import { primaryToggles, secondaryToggles } from "./constants";

interface StepControllerProps {
  user: any;
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel | null) => void;
  isInitializingModels?: boolean;
  selectedCognitive: string | null;
  handleCognitiveToggle: (id: string) => void;
  promptState: any; // Add promptState prop to receive all state and functions
}

export const StepController = ({ 
  user,
  selectedModel,
  setSelectedModel,
  isInitializingModels = false,
  selectedCognitive,
  handleCognitiveToggle,
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
    loadSavedPrompt, isViewingSavedPrompt, setIsViewingSavedPrompt
  } = promptState;
  
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [enhancingMessage, setEnhancingMessage] = useState("Enhancing your prompt with GPT-4o...");
  
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
    user, // Pass user for token tracking
    currentPromptId // Pass prompt ID for token tracking
  );
  
  const { isLoading: isAnalyzing, currentLoadingMessage, handleAnalyze } = promptAnalysis;
  
  const questionVarOps = useQuestionsAndVariables(
    questions,
    setQuestions,
    variables,
    setVariables,
    variableToDelete,
    setVariableToDelete,
    user, // Pass user for token tracking
    currentPromptId // Pass prompt ID for token tracking
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
    editingPrompt // Pass editingPrompt parameter
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

  const handleStepChange = async (step: number, bypass: boolean = false) => {
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

    if (step === 3) {
      setIsEnhancingPrompt(true);
      
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
      message += "...";
      
      setEnhancingMessage(message);
      
      try {
        const enhancedPrompt = await promptAnalysis.enhancePromptWithGPT(
          promptText,
          questions,
          variables
        );
        setFinalPrompt(enhancedPrompt);
        setCurrentStep(step);
      } catch (error) {
        console.error("Error enhancing prompt:", error);
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
    if (isAnalyzing || isInitializingModels || isEnhancingPrompt || isEnhancing) {
      let message = isInitializingModels 
        ? "Initializing AI models..." 
        : isEnhancingPrompt 
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
            onAnalyze={handleAnalyze}
            isLoading={isAnalyzing}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedCognitive={selectedCognitive}
            handleCognitiveToggle={handleCognitiveToggle}
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
            getProcessedPrompt={getProcessedPrompt}
            variables={variables}
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
    </div>
  );
};
