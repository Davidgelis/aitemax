
import { Question, Variable } from "./types";
import { RefObject, useEffect } from "react";
import { QuestionList } from "./QuestionList";
import { VariableList } from "./VariableList";
import { Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  originalPrompt
}: StepTwoContentProps) => {
  const { toast } = useToast();
  
  // Check for pre-filled content and auto-mark as relevant
  useEffect(() => {
    if (!Array.isArray(questions) || !Array.isArray(variables)) {
      console.error("Invalid questions or variables array:", { questions, variables });
      return;
    }
    
    // Count pre-filled content
    const prefilledQuestions = questions.filter(q => q.answer && q.answer.trim() !== '').length;
    const prefilledVariables = variables.filter(v => v.value && v.value.trim() !== '').length;
    
    console.log("Pre-filled content check:", { prefilledQuestions, prefilledVariables });
    console.log("First few variables:", variables.slice(0, 3));
    
    if (prefilledQuestions > 0 || prefilledVariables > 0) {
      // Show toast notification about pre-filled content
      toast({
        title: "Information extracted",
        description: `Pre-filled ${prefilledQuestions} question${prefilledQuestions !== 1 ? 's' : ''} and ${prefilledVariables} variable${prefilledVariables !== 1 ? 's' : ''} based on provided context.`,
      });
      
      // Auto-mark pre-filled questions and variables as relevant
      questions.forEach(question => {
        if (question.answer && question.answer.trim() !== '' && question.isRelevant !== true) {
          console.log(`Auto-marking question as relevant due to pre-filled answer: ${question.text}`);
          onQuestionRelevance(question.id, true);
        }
      });
      
      variables.forEach(variable => {
        if (variable.value && variable.value.trim() !== '' && variable.isRelevant !== true) {
          console.log(`Auto-marking variable as relevant due to pre-filled value: ${variable.name} = ${variable.value}`);
          onVariableRelevance(variable.id, true);
        }
      });
    }
  }, [questions, variables, toast, onQuestionRelevance, onVariableRelevance]);

  return (
    <div className="border rounded-xl p-6 bg-card">
      <div className="mb-6">
        <p className="text-[#545454] mb-4">Answer the following questions and complete the variables to improve your final prompt accuracy. Fill in only what applies and mark or remove the irrelevant ones.</p>
        
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
          <span>Please make sure to fill out everything before continuing.</span>
        </div>
        <button 
          onClick={onContinue} 
          className="aurora-button"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
