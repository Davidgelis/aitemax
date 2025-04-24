
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

  // Count pre-filled questions
  const prefilledCount = questions.filter(q => q.answer).length;
  const hasPrefilledQuestions = prefilledCount > 0;
  
  // Show original prompt for context
  const shortenedPrompt = originalPrompt && originalPrompt.length > 100 
    ? originalPrompt.substring(0, 100) + "..." 
    : originalPrompt;

  return (
    <div className="border rounded-xl p-6 bg-card">
      {originalPrompt && (
        <div className="mb-4 p-3 bg-muted/30 rounded-md">
          <p className="text-sm font-medium mb-1">{t.steps.originalPrompt}:</p>
          <p className="text-sm italic text-muted-foreground">{shortenedPrompt}</p>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-card-foreground">
            {t.steps.questionsToAnswer}
          </p>
          {hasPrefilledQuestions && (
            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md">
              {prefilledCount} {t.steps.prefilledAnswers}
            </span>
          )}
        </div>
        
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
