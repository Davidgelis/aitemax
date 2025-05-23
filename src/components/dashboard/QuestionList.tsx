
import React, { useEffect } from "react";
import { QuestionItem } from "./QuestionItem";
import { Question } from "./types";

interface QuestionListProps {
  questions: Question[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  originalPrompt: string;
}

export const QuestionList = ({
  questions,
  onQuestionRelevance,
  onQuestionAnswer,
  containerRef,
  originalPrompt
}: QuestionListProps) => {
  // Debug logs for questions
  useEffect(() => {
    console.log("Incoming questions:", questions);
    // Log prefilled answers specifically for debugging
    const prefilledQuestions = questions.filter(q => q.answer && q.answer.trim());
    if (prefilledQuestions.length > 0) {
      console.log("Prefilled questions:", prefilledQuestions);
    }
  }, [questions]);

  // Group questions by category
  const groupedQuestions: Record<string, Question[]> = questions.reduce((result, question) => {
    const category = question.category || "Other";
    if (!result[category]) {
      result[category] = [];
    }
    result[category].push(question);
    return result;
  }, {} as Record<string, Question[]>);
  
  // Log grouped questions for debugging
  console.log("Grouped questions:", groupedQuestions);

  // Format question text to handle both formats
  const formatQuestionText = (question: Question): string => {
    // Handle both text and question fields from the API
    return question.text || (question as any).question || "No question text";
  };
  
  // Check if we have any questions to render
  if (questions.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4 text-center">
        <p className="text-muted-foreground">
          No questions generated. Try refreshing or adjusting your prompt.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4 overflow-auto pr-2">
      {Object.entries(groupedQuestions).map(([category, categoryQuestions], index) => (
        <div key={category} className="space-y-2">
          <h2 className="font-medium text-sm text-[#545454]">
            {category}
          </h2>
          <div className="grid gap-2">
            {categoryQuestions.map((question) => {
              // Ensure question.text is properly set
              const processedQuestion = {
                ...question,
                text: formatQuestionText(question) // Use the formatted text
              };
              
              return (
                <QuestionItem
                  key={question.id}
                  question={processedQuestion}
                  onRelevanceChange={(isRelevant) => onQuestionRelevance(question.id, isRelevant)}
                  onAnswerChange={(answer) => onQuestionAnswer(question.id, answer)}
                  originalPrompt={originalPrompt}
                  exampleAnswers={question.examples || []}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
