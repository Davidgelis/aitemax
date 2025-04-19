
import { Question, Variable } from "./types";
import { RefObject } from "react";
import { QuestionList } from "./QuestionList";
import { VariableList } from "./VariableList";
import { useLanguage } from "@/context/LanguageContext";
import { dashboardTranslations } from "@/translations/dashboard";

interface StepTwoProps {
  questions: Question[];
  variables: Variable[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  onVariableChange: (variableId: string, field: 'name' | 'value', content: string) => void;
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
  originalPrompt
}: StepTwoProps) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  return (
    <div className="border rounded-xl p-6 bg-card">
      <div className="mb-6">
        <p className="text-card-foreground mb-4">
          {t.steps.questionsToAnswer}
        </p>
        
        <QuestionList 
          questions={questions}
          onQuestionRelevance={onQuestionRelevance}
          onQuestionAnswer={onQuestionAnswer}
          containerRef={questionsContainerRef}
          originalPrompt={originalPrompt}
        />
      </div>

      <div className="mt-8">
        <VariableList
          variables={variables}
          onVariableChange={onVariableChange}
          onVariableRelevance={onVariableRelevance}
          onAddVariable={onAddVariable}
          onDeleteVariable={onDeleteVariable}
          variableToDelete={variableToDelete}
          setVariableToDelete={setVariableToDelete}
          containerRef={variablesContainerRef}
          originalPrompt={originalPrompt}
        />
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={onContinue}
          disabled={!canProceedToStep3}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {t.steps.continue}
        </button>
      </div>
    </div>
  );
};
