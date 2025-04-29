
import { Question, Variable } from "./types";
import { RefObject } from "react";
import { QuestionList } from "./QuestionList";
import { VariableList } from "./VariableList";
import { useLanguage } from "@/context/LanguageContext";
import { dashboardTranslations } from "@/translations/dashboard";
import { Info } from "lucide-react";

interface StepTwoProps {
  questions: Question[];
  variables: Variable[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  onVariableChange: (variableId: string, field: 'name' | 'value', content: string) => void;
  onVariableRelevance: (variableId: string, isRelevant: boolean) => void;
  onAddVariable: () => void;
  onDeleteVariable: (id: string) => void;  // Updated to match expected signature
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
  
  // Check for image analysis questions
  const imageAnalysisQuestions = questions.filter(q => q.contextSource === "image" || q.category === "Image Analysis");
  const hasImageAnalysis = imageAnalysisQuestions.length > 0;

  // Group questions by category to show distribution
  const categoryCounts = questions.reduce((acc, q) => {
    acc[q.category || 'Other'] = (acc[q.category || 'Other'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count total questions
  const totalQuestions = questions.length;

  return (
    <div className="border rounded-xl p-6 bg-card">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-card-foreground">
            {t.steps.questionsToAnswer} ({totalQuestions})
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {hasPrefilledQuestions && (
              <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md">
                {prefilledCount} {t.steps.prefilledAnswers}
              </span>
            )}
            {hasImageAnalysis && (
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {imageAnalysisQuestions.length} from image
              </span>
            )}
            {Object.keys(categoryCounts).length > 0 && (
              <span className="text-xs text-gray-600">
                {Object.entries(categoryCounts).map(([cat, count]) => 
                  `${cat}: ${count}`
                ).join(', ')}
              </span>
            )}
          </div>
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
