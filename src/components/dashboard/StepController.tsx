
import { useState, useEffect, useRef } from "react";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import { StepThree } from "@/components/dashboard/step-three/StepThree";
import { usePromptState } from "@/hooks/usePromptState";
import { usePromptAnalysis } from "@/hooks/usePromptAnalysis";
import { useToast } from "@/hooks/use-toast";
import { primaryToggles, secondaryToggles } from "./constants";

export const StepController = () => {
  const { toast } = useToast();
  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const variablesContainerRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const user = null; // Replace with actual user object when available

  const {
    promptText,
    setPromptText,
    questions,
    setQuestions,
    variables,
    setVariables,
    masterCommand,
    setMasterCommand,
    finalPrompt,
    setFinalPrompt,
    selectedPrimary,
    setSelectedPrimary,
    selectedSecondary,
    setSelectedSecondary,
    canProceedToStep3,
    setCanProceedToStep3,
    variableToDelete,
    setVariableToDelete,
    handleAddVariable,
    handleDeleteVariable,
    handleQuestionRelevance,
    handleQuestionAnswer,
    handleVariableChange,
    handleVariableRelevance,
    selectedTemplateId,
    templates,
    handleSelectTemplate
  } = usePromptState(user);

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
    null // Prompt ID
  );

  useEffect(() => {
    // Check if all relevant questions have answers
    const allRelevantAnswered = questions.every(q => {
      return q.isRelevant === false || (q.isRelevant === true && q.answer && q.answer.trim() !== "");
    });

    // Check if all relevant variables have values
    const allRelevantVariablesFilled = variables.every(v => {
      return v.isRelevant === false || (v.isRelevant === true && v.value && v.value.trim() !== "");
    });

    setCanProceedToStep3(allRelevantAnswered && allRelevantVariablesFilled);
  }, [questions, variables, setCanProceedToStep3]);

  const handleStepChange = async (step: number) => {
    // Prevent going back to step 1
    if (currentStep > step) {
      setCurrentStep(step);
      return;
    }

    // Validate prompt text before proceeding to step 2
    if (currentStep === 1 && step === 2) {
      if (!promptText.trim()) {
        toast({
          title: "Error",
          description: "Please enter a prompt before proceeding.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        await promptAnalysis.handleAnalyze();
        setCurrentStep(step);
      } catch (error) {
        console.error("Error analyzing prompt:", error);
        toast({
          title: "Error",
          description: "There was an error analyzing your prompt. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Moving from step 2 to step 3 - enhance prompt
    if (currentStep === 2 && step === 3) {
      try {
        setIsLoading(true);
        
        // Get the selected template object
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        
        // Call enhancePromptWithGPT and pass the selected template
        await promptAnalysis.enhancePromptWithGPT(
          promptText,
          selectedPrimary,
          selectedSecondary,
          setFinalPrompt,
          selectedTemplate // Pass the selected template
        );
        
        setCurrentStep(step);
      } catch (error) {
        console.error("Error enhancing prompt:", error);
        toast({
          title: "Error",
          description: "There was an error enhancing your prompt. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Proceed to the next step if no specific conditions are met
    setCurrentStep(step);
  };

  return (
    <>
      {currentStep === 1 && (
        <StepOne
          promptText={promptText}
          setPromptText={setPromptText}
          selectedPrimary={selectedPrimary || null}
          setSelectedPrimary={setSelectedPrimary}
          selectedSecondary={selectedSecondary || null}
          setSelectedSecondary={setSelectedSecondary}
          primaryToggles={primaryToggles}
          secondaryToggles={secondaryToggles}
          onAnalyze={() => handleStepChange(2)}
          isLoading={isLoading}
        />
      )}
      
      {currentStep === 2 && !isLoading && (
        <StepTwo
          questions={questions}
          variables={variables}
          onQuestionRelevance={handleQuestionRelevance}
          onQuestionAnswer={handleQuestionAnswer}
          onVariableChange={handleVariableChange}
          onVariableRelevance={handleVariableRelevance}
          onAddVariable={handleAddVariable}
          onDeleteVariable={handleDeleteVariable}
          variableToDelete={variableToDelete}
          setVariableToDelete={setVariableToDelete}
          canProceedToStep3={canProceedToStep3}
          onContinue={() => handleStepChange(3)}
          questionsContainerRef={questionsContainerRef}
          variablesContainerRef={variablesContainerRef}
          originalPrompt={promptText}
          // Pass template-related props
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={handleSelectTemplate}
        />
      )}
      
      {currentStep === 3 && (
        <StepThree
          masterCommand={masterCommand}
          finalPrompt={finalPrompt}
          onBack={() => handleStepChange(2)}
        />
      )}
    </>
  );
};
