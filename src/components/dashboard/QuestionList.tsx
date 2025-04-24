
import React, { RefObject } from 'react';
import { Question } from './types';
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';

interface QuestionListProps {
  questions: Question[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  containerRef: RefObject<HTMLDivElement>;
  originalPrompt: string;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onQuestionRelevance,
  onQuestionAnswer,
  containerRef,
  originalPrompt
}) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  // Count pre-filled questions
  const prefilledCount = questions.filter(q => q.answer).length;
  const hasPrefilledQuestions = prefilledCount > 0;

  // Calculate how many questions might be from image analysis
  const imageAnalysisQuestionsCount = questions.filter(
    q => q.answer && q.answer.toLowerCase().startsWith('based on image analysis')
  ).length;
  
  // Calculate how many questions have been filled automatically from other sources
  const otherPrefilledCount = prefilledCount - imageAnalysisQuestionsCount;

  return (
    <div ref={containerRef} className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
      {hasPrefilledQuestions && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {imageAnalysisQuestionsCount > 0 && (
            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md">
              {imageAnalysisQuestionsCount} {t.steps.prefilledAnswers} (image)
            </span>
          )}
          {otherPrefilledCount > 0 && (
            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              {otherPrefilledCount} {t.steps.prefilledAnswers}
            </span>
          )}
        </div>
      )}
      
      {questions.map(question => (
        <div key={question.id} className="border rounded-lg p-4 bg-background">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <label className="text-card-foreground font-medium text-sm">
                {question.text}
              </label>
              {question.category && (
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                  {question.category}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={question.isRelevant}
                  onChange={(e) => onQuestionRelevance(question.id, e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-xs text-gray-500">{t.variableActions.editVariable}</span>
              </label>
            </div>
          </div>
          <textarea
            value={question.answer || ''}
            onChange={(e) => onQuestionAnswer(question.id, e.target.value)}
            className="w-full border rounded-md p-2 min-h-[80px] text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={!question.isRelevant}
            placeholder={!question.isRelevant ? t.variableActions.editVariable : ''}
          />
        </div>
      ))}
      
      {questions.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          No questions generated. Try adjusting your prompt.
        </div>
      )}
    </div>
  );
};

// Export the translations object
export { dashboardTranslations };
