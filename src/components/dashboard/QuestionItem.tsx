
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
  
  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onAnswerChange(e.target.value);
  };
  
  const toggleRelevance = () => {
    onRelevanceChange(question.isRelevant === false);
  };

  return (
    <div className={`border rounded-lg p-3 ${question.isRelevant === false ? 'bg-gray-50 opacity-70' : 'bg-white'}`}>
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
          </label>
          
          {question.isRelevant !== false && (
            <div className="space-y-2">
              <Textarea
                value={question.answer || ''}
                onChange={handleAnswerChange}
                placeholder="Enter your answer here..."
                className="min-h-[80px] text-sm"
              />
              
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
