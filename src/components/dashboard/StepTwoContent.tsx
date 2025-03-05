import { Question, Variable } from "./types";
import { RefObject } from "react";
import { QuestionList } from "./QuestionList";
import { VariableList } from "./VariableList";
interface StepTwoContentProps {
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
  return <div className="border rounded-xl p-6 bg-card">
      <div className="mb-6">
        <p className="text-card-foreground mb-4">Answer the following questions and complete the variables to improve your final prompt accuracy. Fill in only what applies and mark or remove the irrelevant ones.</p>
        
        <QuestionList questions={questions} onQuestionRelevance={onQuestionRelevance} onQuestionAnswer={onQuestionAnswer} containerRef={questionsContainerRef} originalPrompt={originalPrompt} />
      </div>

      <div className="mb-6">
        <VariableList variables={variables} onVariableChange={onVariableChange} onVariableRelevance={onVariableRelevance} onAddVariable={onAddVariable} onDeleteVariable={onDeleteVariable} variableToDelete={variableToDelete} setVariableToDelete={setVariableToDelete} containerRef={variablesContainerRef} />
      </div>

      <div className="flex justify-end">
        <button onClick={onContinue} className={`aurora-button ${!canProceedToStep3 ? 'opacity-70 cursor-not-allowed' : ''}`} disabled={!canProceedToStep3}>
          Continue
        </button>
      </div>
    </div>;
};