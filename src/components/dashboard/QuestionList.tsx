
import { Check, X } from "lucide-react";
import { Question } from "./types";
import { RefObject } from "react";

interface QuestionListProps {
  questions: Question[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  containerRef: RefObject<HTMLDivElement>;
}

export const QuestionList = ({ 
  questions, 
  onQuestionRelevance, 
  onQuestionAnswer, 
  containerRef 
}: QuestionListProps) => {
  return (
    <div ref={containerRef} className="max-h-[285px] overflow-y-auto pr-2 space-y-4">
      {questions.map((question) => (
        <div key={question.id} className="p-4 border rounded-lg bg-background">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-card-foreground">{question.text}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onQuestionRelevance(question.id, false)}
                  className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                    question.isRelevant === false ? 'bg-[#33fea6]/80' : ''
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onQuestionRelevance(question.id, true)}
                  className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                    question.isRelevant === true ? 'bg-[#33fea6]/80' : ''
                  }`}
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
            {question.isRelevant && (
              <textarea
                value={question.answer}
                onChange={(e) => onQuestionAnswer(question.id, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-3 rounded-md border bg-background text-card-foreground placeholder:text-muted-foreground resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
