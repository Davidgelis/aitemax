
import { Check, X, FileText, HelpCircle } from "lucide-react";
import { Question } from "./types";
import { RefObject, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { placeholderTestQuestions } from "./constants";

interface QuestionListProps {
  questions: Question[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  containerRef: RefObject<HTMLDivElement>;
  originalPrompt?: string; // Add new prop for the original prompt
}

export const QuestionList = ({
  questions,
  onQuestionRelevance,
  onQuestionAnswer,
  containerRef,
  originalPrompt
}: QuestionListProps) => {
  const [showPromptSheet, setShowPromptSheet] = useState(false);

  // Display placeholder test questions if no questions are provided
  const displayQuestions = questions.length > 0 ? questions : placeholderTestQuestions;

  // Group questions by category
  const groupedQuestions: Record<string, Question[]> = {};
  displayQuestions.forEach(question => {
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
        {originalPrompt && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowPromptSheet(true)} 
                  className="flex items-center gap-1 text-sm hover:bg-[#33fea6]/20 p-2 rounded-full transition-colors" 
                  title="View submitted prompt"
                >
                  <FileText className="w-6 h-6 text-[#33fea6]" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View the submitted prompt</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div ref={containerRef} className="max-h-[285px] overflow-y-auto pr-2 space-y-6">
        {categories.map(category => (
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
                        className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${question.isRelevant === false ? 'bg-[#33fea6]/80' : ''}`} 
                        title="Mark as not relevant"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onQuestionRelevance(question.id, true)} 
                        className={`p-2 rounded-full hover:bg-[#33fea6]/20 ${question.isRelevant === true ? 'bg-[#33fea6]/80' : ''}`} 
                        title="Mark as relevant"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {question.isRelevant && (
                    <textarea 
                      value={question.answer} 
                      onChange={e => onQuestionAnswer(question.id, e.target.value)} 
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

      {/* Prompt Sheet */}
      <Sheet open={showPromptSheet} onOpenChange={setShowPromptSheet}>
        <SheetContent className="w-[90%] sm:max-w-[600px] md:max-w-[800px] z-50 bg-white">
          <SheetHeader>
            <SheetTitle>Submitted Prompt</SheetTitle>
            <SheetDescription>
              This is the original prompt you submitted for analysis.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <div className="w-full min-h-[40vh] p-4 text-sm rounded-md border bg-gray-50/80 text-card-foreground overflow-y-auto whitespace-pre-wrap">
              {originalPrompt}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
