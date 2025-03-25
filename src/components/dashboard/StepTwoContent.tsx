
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePromptState } from "@/hooks/usePromptState";
import VariableList from "./VariableList";
import QuestionList from "./QuestionList";
import ToggleSection from "./ToggleSection";
import { PlusCircle, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PromptTemplate } from "./types";
import { TemplateSelector } from "./TemplateSelector";

interface Props {
  onBack: () => void;
  onNext: () => void;
}

const StepTwoContent: React.FC<Props> = ({ onBack, onNext }) => {
  const { user } = useAuth();
  const {
    promptText,
    questions,
    currentQuestionPage,
    setCurrentQuestionPage,
    variables,
    setVariables,
    selectedPrimary,
    setSelectedPrimary,
    selectedSecondary,
    setSelectedSecondary,
    isLoadingPrompts,
    variableToDelete,
    setVariableToDelete,
    setCurrentStep,
    handleEnhancePrompt,
    selectedTemplate,
    setSelectedTemplate
  } = usePromptState(user);

  const handleNext = async () => {
    // Use our enhanced edge function that supports templates
    await handleEnhancePrompt();
    onNext();
  };

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">2. Enhance Your Prompt</h2>
          <TemplateSelector onSelectTemplate={handleSelectTemplate} />
        </div>
        <p className="text-gray-500">
          Customize variables and preferences to generate a more effective
          prompt.
        </p>
      </div>

      <div className="border p-4 rounded-lg bg-white shadow-sm">
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">Prompt Preview</h3>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {promptText}
          </div>
        </div>
      </div>

      {selectedTemplate && (
        <div className="bg-primary/5 p-4 rounded-md">
          <h3 className="font-medium mb-2">Using Template: {selectedTemplate.title}</h3>
          <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
          
          <div className="mt-3">
            <h4 className="text-sm font-medium">Template Sections:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {selectedTemplate.pillars.map(pillar => (
                <li key={pillar.id}>{pillar.name}: {pillar.content}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ToggleSection
        selectedPrimary={selectedPrimary}
        setSelectedPrimary={setSelectedPrimary}
        selectedSecondary={selectedSecondary}
        setSelectedSecondary={setSelectedSecondary}
      />

      <VariableList
        variables={variables}
        setVariables={setVariables}
        variableToDelete={variableToDelete}
        setVariableToDelete={setVariableToDelete}
      />

      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoadingPrompts}
          className="bg-gradient-to-r from-[#8A63E3] to-[#33FEA8] text-white"
        >
          {isLoadingPrompts ? (
            <>
              <span className="mr-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </span>
              Enhancing Prompt...
            </>
          ) : (
            "Generate Enhanced Prompt"
          )}
        </Button>
      </div>

      <AlertDialog
        open={!!variableToDelete}
        onOpenChange={(open) => !open && setVariableToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this variable? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (variableToDelete) {
                  setVariables(
                    variables.filter(
                      (variable) => variable.id !== variableToDelete
                    )
                  );
                  setVariableToDelete(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StepTwoContent;
