import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

import { usePromptState } from "@/hooks/usePromptState";
import { usePromptAnalysis } from "@/hooks/usePromptAnalysis";
import { useQuestionsAndVariables } from "@/hooks/useQuestionsAndVariables";
import { usePromptOperations } from "@/hooks/usePromptOperations";

import { LoadingState } from "@/components/dashboard/LoadingState";
import { StepIndicator } from "@/components/dashboard/StepIndicator";
import { FinalPrompt } from "@/components/dashboard/FinalPrompt";
import { UserSidebar } from "@/components/dashboard/UserSidebar";
import { StepOne } from "@/components/dashboard/StepOne";
import { StepTwo } from "@/components/dashboard/StepTwo";
import { ModelSelector } from "@/components/dashboard/ModelSelector";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  limitations: string[];
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  
  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const variablesContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  
  const promptState = usePromptState(user);
  
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
    handleDeletePrompt, handleDuplicatePrompt, handleRenamePrompt
  } = promptState;
  
  const promptAnalysis = usePromptAnalysis(
    promptText,
    setQuestions,
    setVariables,
    setMasterCommand,
    setFinalPrompt,
    setCurrentStep,
    selectedPrimary,
    selectedSecondary
  );
  
  const { isLoading, currentLoadingMessage, handleAnalyze } = promptAnalysis;
  
  const questionVarOps = useQuestionsAndVariables(
    questions,
    setQuestions,
    variables,
    setVariables,
    variableToDelete,
    setVariableToDelete
  );
  
  const {
    handleQuestionAnswer,
    handleQuestionRelevance,
    handleVariableChange,
    handleVariableRelevance,
    addVariable,
    removeVariable,
    canProceedToStep3
  } = questionVarOps;
  
  const promptOperations = usePromptOperations(
    variables,
    setVariables,
    finalPrompt,
    showJson,
    setEditingPrompt,
    setShowEditPromptSheet,
    masterCommand
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
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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

  const handleStepChange = (step: number) => {
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

    if (step === 3 && !canProceedToStep3) {
      toast({
        title: "Cannot proceed",
        description: "Please mark all questions and variables as relevant or not relevant",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep(step);
  };

  const filteredPrompts = savedPrompts.filter(prompt => 
    searchTerm === "" || 
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.promptText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState currentLoadingMessage={currentLoadingMessage} />;
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="w-full max-w-md">
              <ModelSelector onSelect={setSelectedModel} />
            </div>
            <StepOne
              promptText={promptText}
              setPromptText={setPromptText}
              selectedPrimary={selectedPrimary}
              selectedSecondary={selectedSecondary}
              handlePrimaryToggle={handlePrimaryToggle}
              handleSecondaryToggle={handleSecondaryToggle}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
            />
          </div>
        );

      case 2:
        return (
          <StepTwo
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
            canProceedToStep3={canProceedToStep3}
            onContinue={() => handleStepChange(3)}
            questionsContainerRef={questionsContainerRef}
            variablesContainerRef={variablesContainerRef}
            originalPrompt={promptText}
          />
        );

      case 3:
        return (
          <FinalPrompt 
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto min-h-screen flex items-center justify-center">
            <div className="w-full">
              {renderContent()}
              
              <StepIndicator currentStep={currentStep} onStepChange={handleStepChange} />
            </div>
          </div>
        </main>

        <UserSidebar 
          user={user}
          savedPrompts={savedPrompts}
          filteredPrompts={filteredPrompts}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoadingPrompts={isLoadingPrompts}
          handleNewPrompt={handleNewPrompt}
          handleDeletePrompt={handleDeletePrompt}
          handleDuplicatePrompt={handleDuplicatePrompt}
          handleRenamePrompt={handleRenamePrompt}
        />

        <div className="absolute top-6 right-6 z-50">
          <SidebarTrigger className="bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-md" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
