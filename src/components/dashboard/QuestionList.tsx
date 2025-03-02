
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
  // Group questions by category
  const groupedQuestions: Record<string, Question[]> = {};
  
  questions.forEach(question => {
    const category = question.category || 'Other';
    if (!groupedQuestions[category]) {
      groupedQuestions[category] = [];
    }
    groupedQuestions[category].push(question);
  });

  // Get all categories
  const categories = Object.keys(groupedQuestions);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Questions</h3>
      </div>
      
      <div ref={containerRef} className="max-h-[285px] overflow-y-auto pr-2 space-y-6">
        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <h4 className="font-medium text-sm text-accent">{category}</h4>
            
            {groupedQuestions[category].map((question, index) => (
              <div key={question.id} className="p-4 border rounded-lg bg-background">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#33fea6]/20 text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-card-foreground">{question.text}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onQuestionRelevance(question.id, false)}
                        className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                          question.isRelevant === false ? 'bg-[#33fea6]/80' : ''
                        }`}
                        title="Mark as not relevant"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onQuestionRelevance(question.id, true)}
                        className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${
                          question.isRelevant === true ? 'bg-[#33fea6]/80' : ''
                        }`}
                        title="Mark as relevant"
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
        ))}
      </div>
    </div>
  );
};
