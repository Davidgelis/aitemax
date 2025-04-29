
import { Question, Variable } from "./types";
import { RefObject } from "react";
import { QuestionList } from "./QuestionList";
import { VariableList } from "./VariableList";
import { Info, Loader2 } from "lucide-react";
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';

interface StepTwoContentProps {
  questions: Question[];
  variables: Variable[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  onVariableChange: (variableId: string, field: keyof Variable, content: string) => void;
  onVariableRelevance: (variableId: string, isRelevant: boolean) => void;
  onAddVariable: () => void;
  onDeleteVariable: (id: string) => void; // Updated to match the expected function signature
  variableToDelete: string | null;
  setVariableToDelete: (id: string | null) => void;
  canProceedToStep3: boolean;
  onContinue: () => void;
  questionsContainerRef: RefObject<HTMLDivElement>;
  variablesContainerRef: RefObject<HTMLDivElement>;
  originalPrompt: string;
  isLoading?: boolean;
  loadingMessage?: string;
}

export const StepTwoContent = ({
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
  isLoading = false,
  loadingMessage = ""
}: StepTwoContentProps) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;
  
  // Count pre-filled and image-based questions
  const prefilledCount = questions.filter(q => q.answer).length;
  const hasPrefilledQuestions = prefilledCount > 0;
  
  // Check for image analysis questions
  const imageAnalysisQuestions = questions.filter(q => q.contextSource === "image" || q.category === "Image Analysis");
  const hasImageAnalysis = imageAnalysisQuestions.length > 0;
  
  if (isLoading) {
    return (
      <div className="border rounded-xl p-6 bg-card">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">{loadingMessage || "Processing your prompt..."}</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment for complex prompts.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border rounded-xl p-6 bg-card">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[#545454] mb-0">{t.steps.questionsToAnswer}</p>
          <div className="flex items-center gap-2">
            {hasPrefilledQuestions && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                {prefilledCount} {t.steps.prefilledAnswers}
              </span>
            )}
            {hasImageAnalysis && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {imageAnalysisQuestions.length} from image
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

      <div className="mb-6">
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

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center text-sm text-[#545454] gap-1 italic">
          <Info size={14} />
          <span>{t.steps.continueButtonInfo}</span>
        </div>
        <button 
          onClick={onContinue} 
          className="aurora-button"
        >
          {t.steps.continue}
        </button>
      </div>
    </div>
  );
};
