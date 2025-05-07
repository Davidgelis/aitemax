
import { Question, Variable } from "./types";
import { RefObject } from "react";
import { StepTwoContent } from "./StepTwoContent";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  isLoading?: boolean;
  loadingMessage?: string;
}

export const StepTwo = (props: StepTwoProps) => {
  return (
    <ScrollArea className="h-full" hideScrollbar>
      <StepTwoContent {...props} />
    </ScrollArea>
  );
};
