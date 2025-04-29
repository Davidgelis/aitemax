
import { Question } from "./types";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';
import { RefObject, useMemo } from "react";
import { Info } from "lucide-react";

interface QuestionListProps {
  questions: Question[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  containerRef: RefObject<HTMLDivElement>;
  originalPrompt: string;
}

export const QuestionList = ({
  questions,
  onQuestionRelevance,
  onQuestionAnswer,
  containerRef,
  originalPrompt
}: QuestionListProps) => {
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;
  
  // Group questions by category
  const groupedQuestions = useMemo(() => {
    const grouped: Record<string, Question[]> = {};
    
    questions.forEach(question => {
      const category = question.category || t.defaultCategory;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(question);
    });
    
    return grouped;
  }, [questions, t.defaultCategory]);

  // Count questions with image-based suggestions
  const imageSuggestedCount = questions.filter(q => q.prefillSource === 'image-scan').length;
  
  return (
    <div ref={containerRef} className="max-h-[350px] overflow-y-auto pr-2">
      {questions.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">
          {t.steps.noQuestionsFound}
        </div>
      ) : (
        <>
          {imageSuggestedCount > 0 && (
            <div className="mb-4 p-2 bg-emerald-50 rounded-md flex items-center gap-2 text-sm">
              <Info size={16} className="text-emerald-600" />
              <p className="text-emerald-800">
                {imageSuggestedCount} {imageSuggestedCount === 1 ? 'answer' : 'answers'} suggested from image analysis
              </p>
            </div>
          )}
          
          {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
            <div key={category} className="mb-6">
              <h3 className="font-medium text-sm mb-2">{category}</h3>
              <div className="space-y-3">
                {categoryQuestions.map((question) => (
                  <div 
                    key={question.id} 
                    className={`p-3 border rounded-md ${
                      question.isRelevant === false ? 'bg-gray-50 opacity-60' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="flex-grow">
                        <p className="mb-0 leading-tight">{question.text}</p>
                      </div>
                      <div className="ml-4 flex items-center">
                        <Switch 
                          id={`question-${question.id}`}
                          checked={question.isRelevant !== false}
                          onCheckedChange={(checked) => onQuestionRelevance(question.id, checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-1">
                      <Textarea
                        placeholder={t.steps.typeAnswer}
                        value={question.answer || ""}
                        onChange={(e) => onQuestionAnswer(question.id, e.target.value)}
                        disabled={question.isRelevant === false}
                        className={question.prefillSource === 'image-scan' 
                          ? 'border-l-4 border-emerald-400 pl-2 bg-emerald-50' 
                          : ''}
                      />
                      {question.prefillSource === 'image-scan' && (
                        <span className="text-xs italic text-emerald-600 mt-1 block">
                          suggested from image
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
