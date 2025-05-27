
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Send, Sparkles, Trash2, RefreshCw, Upload, Globe } from 'lucide-react';
import { usePromptAnalysis } from '@/hooks/usePromptAnalysis';
import { QuestionList } from './QuestionList';
import { VariableList } from './VariableList';
import { ToggleSection } from './ToggleSection';
import { ImageUploader } from './ImageUploader';
import { WebScanner } from './WebScanner';
import { SmartContext } from './SmartContext';
import { PromptEditor } from './PromptEditor';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StepTwoContentProps {
  questions: Array<{ 
    id: string; 
    question: string; 
    category: string; 
    isAnswered: boolean; 
    answer?: string;
    text?: string;
    isRelevant?: boolean;
  }>;
  variables: Array<{ 
    id: string; 
    name: string; 
    description: string; 
    placeholder: string; 
    value: string;
    isRelevant?: boolean;
  }>;
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  onVariableChange: (variableId: string, field: string, value: string) => void;
  onVariableRelevance: (variableId: string, isRelevant: boolean) => void;
  onAddVariable: () => void;
  onDeleteVariable: (variableId: string) => void;
  variableToDelete: string | null;
  setVariableToDelete: (id: string | null) => void;
  canProceedToStep3: boolean;
  onContinue: () => void;
  questionsContainerRef: React.RefObject<HTMLDivElement>;
  variablesContainerRef: React.RefObject<HTMLDivElement>;
  originalPrompt: string;
  isLoading: boolean;
  loadingMessage: string;
  warnings: string[];
}

const StepTwoContent: React.FC<StepTwoContentProps> = ({
  questions,
  variables,
  onQuestionRelevance,
  onQuestionAnswer,
  onVariableChange,
  onVariableRelevance,
  onAddVariable,
  onDeleteVariable,
  variableToDelete,
  setVariableToDelete,
  canProceedToStep3,
  onContinue,
  questionsContainerRef,
  variablesContainerRef,
  originalPrompt,
  isLoading,
  loadingMessage,
  warnings
}) => {
  const [showQuestions, setShowQuestions] = useState(true);
  const [showVariables, setShowVariables] = useState(true);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showWebScanner, setShowWebScanner] = useState(false);
  const [showSmartContext, setShowSmartContext] = useState(false);
  const { toast } = useToast();

  const handleToggleQuestions = () => {
    setShowQuestions(!showQuestions);
  };

  const handleToggleVariables = () => {
    setShowVariables(!showVariables);
  };

  const handleToggleImageUploader = () => {
    setShowImageUploader(!showImageUploader);
    setShowWebScanner(false);
    setShowSmartContext(false);
  };

  const handleToggleWebScanner = () => {
    setShowWebScanner(!showWebScanner);
    setShowImageUploader(false);
    setShowSmartContext(false);
  };

  const handleToggleSmartContext = () => {
    setShowSmartContext(!showSmartContext);
    setShowImageUploader(false);
    setShowWebScanner(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Refine Your Prompt</h2>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            onClick={onContinue}
            disabled={!canProceedToStep3}
          >
            <Send className="w-4 h-4 mr-2" />
            Continue to Step 3
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div ref={questionsContainerRef}>
          <ToggleSection
            title="Questions"
            icon={Sparkles}
            isOpen={showQuestions}
            onToggle={handleToggleQuestions}
          >
            <QuestionList
              questions={questions.map(q => ({
                ...q,
                text: q.question,
                isRelevant: q.isRelevant !== false
              }))}
              setQuestions={(newQuestions) => {
                // Handle question updates through props
                newQuestions.forEach(q => {
                  const originalQ = questions.find(orig => orig.id === q.id);
                  if (originalQ && q.answer !== originalQ.answer) {
                    onQuestionAnswer(q.id, q.answer || '');
                  }
                  if (originalQ && q.isRelevant !== originalQ.isRelevant) {
                    onQuestionRelevance(q.id, q.isRelevant || false);
                  }
                });
              }}
            />
          </ToggleSection>
        </div>

        <div ref={variablesContainerRef}>
          <ToggleSection
            title="Variables"
            icon={Sparkles}
            isOpen={showVariables}
            onToggle={handleToggleVariables}
          >
            <VariableList
              variables={variables.map(v => ({
                ...v,
                isRelevant: v.isRelevant !== false
              }))}
              setVariables={(newVariables) => {
                // Handle variable updates through props
                newVariables.forEach(v => {
                  const originalV = variables.find(orig => orig.id === v.id);
                  if (originalV) {
                    Object.keys(v).forEach(key => {
                      if (v[key as keyof typeof v] !== originalV[key as keyof typeof originalV]) {
                        onVariableChange(v.id, key, v[key as keyof typeof v] as string);
                      }
                    });
                  }
                });
              }}
              onInsertVariable={() => {}}
            />
          </ToggleSection>

          <ToggleSection
            title="Image Uploader"
            icon={Upload}
            isOpen={showImageUploader}
            onToggle={handleToggleImageUploader}
          >
            <ImageUploader 
              onImagesChange={() => {}}
              images={[]}
            />
          </ToggleSection>

          <ToggleSection
            title="Web Scanner"
            icon={Globe}
            isOpen={showWebScanner}
            onToggle={handleToggleWebScanner}
          >
            <WebScanner 
              onWebsiteScan={() => {}}
              onClose={() => {}}
            />
          </ToggleSection>

          <ToggleSection
            title="Smart Context"
            icon={Sparkles}
            isOpen={showSmartContext}
            onToggle={handleToggleSmartContext}
          >
            <SmartContext 
              onSmartContext={() => {}}
              onClose={() => {}}
            />
          </ToggleSection>
        </div>
      </div>
    </div>
  );
};

export { StepTwoContent };
export default StepTwoContent;
