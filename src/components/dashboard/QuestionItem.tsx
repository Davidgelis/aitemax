
import React, { useState } from "react";
import { Question } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface QuestionItemProps {
  question: Question;
  onRelevanceChange: (isRelevant: boolean) => void;
  onAnswerChange: (answer: string) => void;
  originalPrompt: string;
  exampleAnswers?: string[];
}

export const QuestionItem = ({
  question,
  onRelevanceChange,
  onAnswerChange,
  originalPrompt,
  exampleAnswers = []
}: QuestionItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxCharLimit = 1000;
  
  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Limit the answer to the maximum character count
    const value = e.target.value.slice(0, maxCharLimit);
    onAnswerChange(value);
  };
  
  const toggleRelevance = () => {
    onRelevanceChange(question.isRelevant === false);
  };

  // Calculate the character count
  const charCount = question.answer?.length || 0;
  const isNearLimit = charCount > maxCharLimit * 0.8;
  const isAtLimit = charCount >= maxCharLimit;

  // Determine if question was pre-filled from image or context for labeling
  let sourceLabel: string | null = null;
  if (question.prefillSource === 'image' || question.prefillSource === 'style-analysis') {
    sourceLabel = 'from image';
  } else if (question.prefillSource === 'context') {
    sourceLabel = 'from context';
  } else if (question.prefillSource === 'website') {
    sourceLabel = 'from website';
  }

  return (
    <div className={`border rounded-lg p-3 mb-2 ${question.isRelevant === false ? 'bg-gray-50 opacity-70' : 'bg-white'}`}>
      <div className="flex items-start gap-2">
        <Checkbox 
          id={`question-${question.id}`}
          checked={question.isRelevant !== false}
          onCheckedChange={toggleRelevance}
          className="mt-1"
        />
        <div className="flex-1">
          <label 
            htmlFor={`question-${question.id}`}
            className={`block text-sm mb-2 ${question.isRelevant === false ? 'text-gray-500' : 'text-gray-700'}`}
          >
            {question.text}
            {question.answer && sourceLabel && (
              <span className="ml-2 text-xs italic text-gray-500">({sourceLabel})</span>
            )}
          </label>
          
          {question.isRelevant !== false && (
            <div className="space-y-2">
              <Textarea
                value={question.answer || ''}
                onChange={handleAnswerChange}
                placeholder="Enter your answer here..."
                className="min-h-[80px] text-sm"
                maxLength={maxCharLimit}
              />
              
              {/* Character counter */}
              <div className={`flex justify-end text-xs ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-gray-500'}`}>
                <span>{charCount}/{maxCharLimit}</span>
              </div>
              
              {exampleAnswers && exampleAnswers.length > 0 && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {isExpanded ? 'Hide examples' : 'Show examples'}
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-2 space-y-2">
                      {exampleAnswers.map((example, index) => (
                        <div key={index} className="bg-blue-50 p-2 rounded text-xs">
                          <p className="font-medium text-blue-700 mb-1">Example {index + 1}:</p>
                          <p className="text-gray-700">{example}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
