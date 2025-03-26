
import { Question, Variable } from "./types";
import { RefObject } from "react";
import { StepTwoContent } from "./StepTwoContent";
import { TemplateType } from "../x-templates/XTemplateCard";

interface StepTwoProps {
  questions: Question[];
  variables: Variable[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  onVariableChange: (variableId: string, field: keyof Variable, content: string) => void;
  onVariableRelevance: (variableId: string, isRelevant: boolean) => void;
  onAddVariable: () => void;
  onDeleteVariable: () => void;
  variableToDelete: string | null;
  setVariableToDelete: (id: string | null) => void;
  canProceedToStep3: boolean;
  onContinue: () => void;
  questionsContainerRef: RefObject<HTMLDivElement>;
  variablesContainerRef: RefObject<HTMLDivElement>;
  originalPrompt: string;
  // New props for template selection
  templates: TemplateType[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
}

export const StepTwo = ({
  questions,
  variables,
  onQuestionRelevance,
  onQuestionAnswer,
  onVariableChange,
  onVariableRelevance,
  onAddVariable,
  onDeleteVariable,
  variableToDelete,
  setVariableToDelete,
  canProceedToStep3,
  onContinue,
  questionsContainerRef,
  variablesContainerRef,
  originalPrompt,
  // New props
  templates,
  selectedTemplateId,
  onSelectTemplate
}: StepTwoProps) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Customize your prompt</h2>
        <p className="text-[#545454]">Enhance your prompt by answering these targeted questions and adjusting the variables.</p>
      </div>

      <StepTwoContent
        questions={questions}
        variables={variables}
        onQuestionRelevance={onQuestionRelevance}
        onQuestionAnswer={onQuestionAnswer}
        onVariableChange={onVariableChange}
        onVariableRelevance={onVariableRelevance}
        onAddVariable={onAddVariable}
        onDeleteVariable={onDeleteVariable}
        variableToDelete={variableToDelete}
        setVariableToDelete={setVariableToDelete}
        canProceedToStep3={canProceedToStep3}
        onContinue={onContinue}
        questionsContainerRef={questionsContainerRef}
        variablesContainerRef={variablesContainerRef}
        originalPrompt={originalPrompt}
        // Pass template props
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={onSelectTemplate}
      />
    </div>
  );
}
