
import { Question, Variable } from "./types";
import { RefObject, useState, useEffect } from "react";
import { QuestionList } from "./QuestionList";
import { VariableList } from "./VariableList";
import { Info, Loader2 } from "lucide-react";
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
  warnings?: string[];
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
  loadingMessage = "",
  warnings = []
}: StepTwoContentProps) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;
  
  // Add debug logging for prefilled questions and variables
  useEffect(() => {
    // Debug logging for questions with answers
    const questionsWithAnswers = questions.filter(q => q.answer && q.answer.trim());
    console.log(`StepTwoContent: ${questionsWithAnswers.length}/${questions.length} questions have prefilled answers`);
    
    // Debug logging for variables
    const variablesWithValues = variables.filter(v => v.value && v.value.trim());
    console.log(`StepTwoContent: ${variablesWithValues.length}/${variables.length} variables have prefilled values`);
    
    // Log the source of prefilled data
    const sourceMapping = {
      "image": questions.filter(q => q.prefillSource === "image" || q.prefillSource === "style-analysis").length,
      "context": questions.filter(q => q.prefillSource === "context").length,
      "website": questions.filter(q => q.prefillSource === "website").length,
    };
    console.log("StepTwoContent: Prefill sources:", sourceMapping);
  }, [questions, variables]);
  
  // State for the question answer editing sheet
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  
  // Count pre-filled and image-based questions
  const prefilledCount = questions.filter(q => q.answer).length;
  const hasPrefilledQuestions = prefilledCount > 0;
  
  // Check for image analysis questions
  const imageAnalysisQuestions = questions.filter(q => q.contextSource === "image" || q.category === "Image Analysis");
  const hasImageAnalysis = imageAnalysisQuestions.length > 0;
  
  // Check for context-based prefilled questions
  const contextPrefilledQuestions = questions.filter(q => q.prefillSource === "context" || q.prefillSource === "website");
  const hasContextPrefill = contextPrefilledQuestions.length > 0;
  
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
    // wrap loading spinner in the same centering wrappers
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex flex-col flex-1 justify-center items-center p-4 pt-12">
          <div className="w-full border rounded-xl p-6 bg-card">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">{loadingMessage || "Processing your prompt..."}</p>
              <p className="text-sm text-muted-foreground mt-2">
                This may take a moment for complex prompts.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // normal (non-loading) state
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col flex-1 justify-center items-center p-4 pt-12">
        <div className="w-full border rounded-xl p-6 bg-card">
          {/* Inline warnings (if any) */}
          {warnings.length > 0 && (
            <div className="p-4 mb-4 rounded-md border-l-4 border-yellow-500 bg-yellow-50 text-sm text-yellow-800">
              {warnings.map((msg, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Info size={16} className="mt-0.5" />
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[#545454] mb-0">{t.steps.questionsToAnswer}</p>
              <div className="flex items-center gap-2">
                {hasPrefilledQuestions && (
                  <span className="text-xs text-[#041524] bg-[#33fea6]/20 px-2 py-1 rounded-md">
                    {prefilledCount} {t.steps.prefilledAnswers}
                  </span>
                )}
                {hasImageAnalysis && (
                  <span className="text-xs text-[#33fea6] bg-[#64bf95]/20 px-2 py-1 rounded-md">
                    {imageAnalysisQuestions.length} from image
                  </span>
                )}
                {hasContextPrefill && (
                  <span className="text-xs text-[#33fea6] bg-[#084b49]/20 px-2 py-1 rounded-md">
                    {contextPrefilledQuestions.length} from context
                  </span>
                )}
              </div>
            </div>
            
            <div className="max-h-[380px] overflow-y-auto border rounded-md p-2 mb-4" ref={questionsContainerRef}>
              <QuestionList
                questions={questions}
                onQuestionRelevance={onQuestionRelevance}
                onQuestionAnswer={onQuestionAnswer}
                containerRef={questionsContainerRef}
                originalPrompt={originalPrompt}
              />
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

          <div className="flex flex-col items-end gap-2 mt-6 pt-4 border-t">
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
      </div>
    </div>
  );
};
