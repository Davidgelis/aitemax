
import { Question, Variable } from "./types";
import { RefObject, useState } from "react";
import { QuestionList } from "./QuestionList";
import { VariableList } from "./VariableList";
import { Info, Loader2, X } from "lucide-react";
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface StepTwoContentProps {
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
  
  // State for the question answer editing sheet
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  
  // Count pre-filled and image-based questions
  const prefilledCount = questions.filter(q => q.answer).length;
  const hasPrefilledQuestions = prefilledCount > 0;
  
  // Check for image analysis questions
  const imageAnalysisQuestions = questions.filter(q => q.contextSource === "image" || q.category === "Image Analysis");
  const hasImageAnalysis = imageAnalysisQuestions.length > 0;
  
  // Handle opening the answer sheet
  const handleOpenAnswerSheet = (question: Question) => {
    setSelectedQuestion(question);
    setAnswerDraft(question.answer || "");
  };
  
  // Handle saving the answer
  const handleSaveAnswer = () => {
    if (selectedQuestion) {
      onQuestionAnswer(selectedQuestion.id, answerDraft);
      setSelectedQuestion(null);
    }
  };
  
  // Handle question relevance toggle
  const handleToggleRelevance = (questionId: string, isCurrentlyRelevant: boolean) => {
    onQuestionRelevance(questionId, !isCurrentlyRelevant);
  };
  
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
        
        <div className="max-h-64 overflow-y-auto border rounded-md p-2 mb-4" ref={questionsContainerRef}>
          {questions.map((question, index) => (
            <div 
              key={question.id} 
              className={`mb-3 p-3 border rounded-md flex items-start gap-3 transition-opacity ${
                question.isRelevant === false ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#33fea6]/20 text-xs font-medium flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">{question.text}</div>
                <div 
                  className="text-sm text-muted-foreground cursor-pointer hover:underline"
                  onClick={() => handleOpenAnswerSheet(question)}
                >
                  {question.answer 
                    ? question.answer.length > 50 
                      ? `${question.answer.substring(0, 50)}...` 
                      : question.answer
                    : "Click to add answer"}
                </div>
              </div>
              <button 
                onClick={() => handleToggleRelevance(question.id, question.isRelevant !== false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="max-h-64 overflow-y-auto border rounded-md">
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
      </div>

      <div className="flex flex-col items-end gap-2 mt-6 pt-4 border-t sticky bottom-0 bg-white">
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

      {/* Question Answer Editing Sheet */}
      <Sheet open={selectedQuestion !== null} onOpenChange={(open) => !open && setSelectedQuestion(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Answer Question</SheetTitle>
            <SheetDescription>
              {selectedQuestion?.text}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <textarea
              value={answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
              className="w-full min-h-[200px] p-4 border rounded-md resize-none"
              placeholder="Type your answer here..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedQuestion(null)}
                className="px-4 py-2 rounded-md border"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAnswer}
                className="px-4 py-2 rounded-md bg-[#33fea6] text-white"
              >
                Save Answer
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
