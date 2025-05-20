import { useRef, useState, useEffect, useCallback } from "react";
import { StepHeader } from "./steps/StepHeader";
import { SessionInfo } from "./steps/SessionInfo";
import { DraftStatus } from "./steps/DraftStatus";
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
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { useLanguage } from "@/context/LanguageContext";
import { dashboardTranslations } from "@/translations/dashboard";
import { GPT41_ID } from "@/services/model/ModelFetchService"; // Import the GPT-4.1 ID constant
import { supabase } from "@/integrations/supabase/client";

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
  const { currentTemplate, getCurrentTemplate, isLoading: isLoadingTemplate } = useTemplateManagement();
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;
  
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
    saveDraft,
    isDirty,
    isSaving
  } = promptState;
  
  const jumpToStep = useCallback(
    (s: number) => setCurrentStep(s),
    [setCurrentStep]
  );
  
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [enhancingMessage, setEnhancingMessage] = useState("Building your final prompt with Aitema X");
  const [analysisWarnings, setAnalysisWarnings] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [websiteContext, setWebsiteContext] = useState<{ url: string; instructions: string } | null>(null);
  const [smartContext, setSmartContext] = useState<{ context: string; usageInstructions: string } | null>(null);
  const [shouldAnalyzeAfterContextChange, setShouldAnalyzeAfterContextChange] = useState(false);
  const [preventStepChange, setPreventStepChange] = useState(false);
  const [authCheckInProgress, setAuthCheckInProgress] = useState(false);
  
  const currentPromptId = isViewingSavedPrompt && savedPrompts && savedPrompts.length > 0
    ? savedPrompts.find(p => p.promptText === promptText)?.id || null
    : null;
  
  // Fix: Pass currentPromptId as the 8th parameter to usePromptAnalysis
  const promptAnalysis = usePromptAnalysis(
    promptText,
    setQuestions,
    setVariables,
    setMasterCommand,
    setFinalPrompt,
    jumpToStep,
    user,
    currentPromptId,
    setAnalysisWarnings
  );
  
  const { isLoading: isAnalyzing, currentLoadingMessage, loadingState, handleAnalyze, enhancePromptWithGPT, retryCount } = promptAnalysis;
  
  /* param order in the hook:                                          *
   * (questions, setQuestions, variables, setVariables, variableToDelete …) */
  const questionVarOps = useQuestionsAndVariables(
    questions || [],
    setQuestions,
    variables || [],
    setVariables,          // ➊  ← MISSING before (caused TS2554 & runtime shift)
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
    enhancePromptWithGPT: qvEnhancePromptWithGPT,
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

  // Check for authentication status before critical operations
  const checkAuthBeforeOperation = async () => {
    if (authCheckInProgress) return false;
    
    try {
      setAuthCheckInProgress(true);
      
      // Check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No active session found, attempting to reauthenticate");
        await supabase.auth.signInAnonymously();
        toast({
          title: "Authentication refreshed",
          description: "Your session has been refreshed. Please try your action again.",
          variant: "default",
        });
        return false; // Return false to prevent the operation from proceeding
      }
      
      // If session exists but is about to expire (less than 5 mins remaining)
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
      const now = new Date();
      
      if (expiresAt && ((expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000)) {
        console.log("Session expires soon, refreshing:", expiresAt.toLocaleString());
        await supabase.auth.refreshSession();
        toast({
          title: "Session refreshed",
          description: "Your session has been updated.",
          variant: "default",
        });
      }
      
      return true; // Authentication is valid
    } catch (error) {
      console.error("Auth check failed:", error);
      toast({
        title: "Authentication issue",
        description: "We had trouble verifying your session. Please refresh the page.",
        variant: "destructive",
      });
      return false;
    } finally {
      setAuthCheckInProgress(false);
    }
  };
  
  // Ensure we fetch saved prompts when user is available
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
  };

  const handleSmartContext = (context: string, usageInstructions: string) => {
    console.log("StepController: Smart context set:", { 
      context: context.substring(0, 100) + (context.length > 100 ? "..." : ""),
      usageInstructions: usageInstructions.substring(0, 100) + (usageInstructions.length > 100 ? "..." : "")
    });
    setSmartContext({ context, usageInstructions });
  };

  const handleAnalyzeWithContext = async () => {
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
    
    // Check authentication status before proceeding
    const authOk = await checkAuthBeforeOperation();
    if (!authOk) {
      console.log("Authentication check failed, not proceeding with analysis");
      return;
    }
    
    console.log("StepController: Analyzing with context", {
      imagesCount: uploadedImages?.length || 0,
      hasWebsiteContext: !!websiteContext && !!websiteContext.url,
      hasSmartContext: !!smartContext && !!smartContext.context,
      websiteUrl: websiteContext?.url || "none",
      websiteInstructions: websiteContext?.instructions || "none",
      retryCount: retryCount
    });
    
    // Ensure we're passing valid values to handleAnalyze
    const validImages = Array.isArray(uploadedImages) && uploadedImages.length > 0 ? uploadedImages : null;
    const validWebsiteContext = websiteContext && websiteContext.url ? websiteContext : null;
    const validSmartContext = smartContext && smartContext.context ? smartContext : null;
    
    // Add console logs for debugging
    console.log("Starting prompt analysis with:", {
      promptText: promptText.substring(0, 50) + (promptText.length > 50 ? "..." : ""),
      imageCount: validImages?.length || 0,
      hasWebContext: !!validWebsiteContext,
      hasSmartContext: !!validSmartContext
    });
    
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

    if (step === 2 && questions.length === 0 && variables.length === 0) {
      // Check auth before analysis
      const authOk = await checkAuthBeforeOperation();
      if (!authOk) {
        console.log("Authentication check failed, not proceeding with analysis");
        return;
      }
      
      toast({
        title: "Analyzing prompt",
        description: "Processing your prompt before proceeding to step 2",
        variant: "default",
      });
      
      // Automatically trigger analysis if needed
      console.log("Automatically triggering analysis before step 2");
      await handleAnalyzeWithContext();
      return; // Don't proceed yet, analysis will call jumpToStep(2) when complete
    }

    // Save draft only when moving from step 1 to step 2
    // Not when moving to step 3
    if (step === 2 && currentStep === 1 && user && !isViewingSavedPrompt) {
      saveDraft();
    }

    if (step === 3) {
      // Check auth before enhancing
      const authOk = await checkAuthBeforeOperation();
      if (!authOk) {
        console.log("Authentication check failed, not proceeding to step 3");
        return;
      }
      
      setIsEnhancingPrompt(true);
      
      // Set the fixed message for step 3 transition
      setEnhancingMessage("Building your final prompt with Aitema X");
      
      try {
        console.log("StepController: Enhancing prompt for step 3 with o3-mini...");
        
        // Get the current template from our hook
        const templateToUse = getCurrentTemplate();
        
        // Log the template being used
        console.log("StepController: Using template for enhancement:", {
          id: templateToUse.id,
          name: templateToUse.name,
          pillarsCount: templateToUse.pillars?.length || 0,
          temperature: templateToUse.temperature,
          characterLimit: templateToUse.characterLimit
        });
        
        // Get the answered questions and relevant variables
        const answeredQuestions = questions.filter(q => q.isRelevant !== false && q.answer?.trim());
        const relevantVariables = variables.filter(v => v.isRelevant === true);
        
        console.log("StepController: Calling enhancePromptWithGPT with:", {
          promptText: promptText.substring(0, 50) + "...",
          selectedPrimary,
          selectedSecondary,
          answeredQuestions: answeredQuestions.length,
          relevantVariables: relevantVariables.length,
          templateName: templateToUse.name
        });
        
        // Use the enhancePromptWithGPT from promptAnalysis
        await enhancePromptWithGPT(
          promptText,
          selectedPrimary,
          selectedSecondary,
          setFinalPrompt,
          answeredQuestions,
          relevantVariables,
          templateToUse
        );
        
        console.log("StepController: Successfully enhanced prompt, moving to step 3");
        setCurrentStep(step);
      } catch (error) {
        console.error("StepController: Error enhancing prompt:", error);
        
        // Still allow user to proceed to step 3 with a fallback message
        toast({
          title: "Warning",
          description: "There was an issue enhancing your prompt, but you can still proceed with the original text.",
          variant: "default",
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
    if (isAnalyzing || isEnhancingPrompt || isEnhancing || isLoadingTemplate) {
      let message = isEnhancingPrompt 
        ? enhancingMessage
        : isEnhancing
          ? currentLoadingMessage
          : isLoadingTemplate
            ? "Loading template..."
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
            questions={questions || []} // Make sure we pass default empty arrays
            variables={variables || []}
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
            isLoading={isAnalyzing}
            loadingMessage={loadingState?.message || currentLoadingMessage}
            warnings={analysisWarnings}
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
            setFinalPrompt={setFinalPrompt}
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

  // On component mount, automatically select GPT-4.1 if no model is selected
  useEffect(() => {
    if (!selectedModel) {
      const gpt41Model = {
        id: GPT41_ID, // Using the constant instead of hardcoded string
        name: "GPT-4.1",
        provider: "OpenAI",
        description: "The latest GPT-4.1 model from OpenAI",
        strengths: ["Advanced reasoning", "State-of-the-art performance", "Better context handling"],
        limitations: ["Experimental model", "May produce unexpected results"],
        updated_at: new Date().toISOString()
      };
      setSelectedModel(gpt41Model);
      console.log("Auto-selected GPT-4.1 model");
    }
  }, []);

  // Add diagnostic logs for step transitions and data state
  useEffect(() => {
    console.log(`Current step: ${currentStep}, Questions: ${questions.length}, Variables: ${variables.length}`);
  }, [currentStep, questions.length, variables.length]);

  // Add automatic retry logic if analysis fails repeatedly
  useEffect(() => {
    if (retryCount > 0 && retryCount < 3 && currentStep === 1) {
      console.log(`Auto-retrying analysis after failure (attempt ${retryCount + 1})...`);
      
      // Add a delay before retrying
      const timer = setTimeout(() => {
        handleAnalyzeWithContext();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  return (
    <div className="w-full h-full flex flex-col">
      {user && promptState.currentStep === 2 && (
        <div className="fixed top-0 right-0 left-0 z-50 bg-background/90 backdrop-blur-sm border-b p-2 flex justify-between items-center">
          <DraftStatus 
            isDirty={isDirty}
            isSaving={isSaving}
            onSaveDraft={saveDraft}
          />
          
          <div className="flex items-center gap-3">
            <SessionInfo />
          </div>
        </div>
      )}

      <div className="flex-grow overflow-hidden flex flex-col">
        {renderContent()}
      </div>
      
      <div className="mt-auto">
        <StepIndicator 
          currentStep={currentStep} 
          onStepChange={handleDirectJump} 
          isViewingSavedPrompt={isViewingSavedPrompt}
          isLoading={isAnalyzing}
          onAnalyze={currentStep === 1 ? handleAnalyzeWithContext : undefined}
          promptText={promptText}
        />
      </div>
      
      <PrivacyNoticePopup user={user} currentStep={currentStep} />
    </div>
  );
};
