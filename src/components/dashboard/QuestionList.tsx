
import React from "react";
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
  // Group questions by category
  const groupedQuestions: Record<string, Question[]> = questions.reduce((result, question) => {
    const category = question.category || "Other";
    if (!result[category]) {
      result[category] = [];
    }
    result[category].push(question);
    return result;
  }, {} as Record<string, Question[]>);

  // Log for debugging
  console.log("Incoming questions:", questions);
  console.log("Grouped questions:", groupedQuestions);

  // Format question text to handle both formats
  const formatQuestionText = (question: Question): string => {
    // Handle both text and question fields from the API
    return question.text || question.question || "No question text";
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
            {categoryQuestions.map((question) => (
              <QuestionItem
                key={question.id}
                question={{
                  ...question,
                  text: formatQuestionText(question) // Ensure we use the correctly formatted text
                }}
                onRelevanceChange={(isRelevant) => onQuestionRelevance(question.id, isRelevant)}
                onAnswerChange={(answer) => onQuestionAnswer(question.id, answer)}
                originalPrompt={originalPrompt}
                exampleAnswers={question.examples || []}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
