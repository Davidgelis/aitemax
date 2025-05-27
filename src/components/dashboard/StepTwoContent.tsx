
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Send, Sparkles, Trash2, RefreshCw, Upload, Globe } from 'lucide-react';
import { usePromptAnalysis } from '@/hooks/usePromptAnalysis';
import { QuestionList } from './QuestionList';
import { VariableList } from './VariableList';
import { ImageUploader } from './ImageUploader';
import { WebScanner } from './WebScanner';
import { SmartContext } from './SmartContext';
import { PromptEditor } from './PromptEditor';
import { useToast } from '@/hooks/use-toast';
import { Question, Variable } from './types';

interface StepTwoContentProps {
  questions: Question[];
  variables: Variable[];
  onQuestionRelevance: (questionId: string, isRelevant: boolean) => void;
  onQuestionAnswer: (questionId: string, answer: string) => void;
  onVariableChange: (variableId: string, field: string, value: string) => void;
  onVariableRelevance: (variableId: string, isRelevant: boolean) => void;
  onAddVariable: () => void;
  onDeleteVariable: () => void;
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

// Create a simple collapsible section component
const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ComponentType<any>;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon: Icon, isOpen, onToggle, children }) => (
  <div className="border rounded-lg bg-white">
    <button
      onClick={onToggle}
      className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="font-medium">{title}</span>
      </div>
      <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
        ▼
      </span>
    </button>
    {isOpen && (
      <div className="p-4 border-t">
        {children}
      </div>
    )}
  </div>
);

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
          <CollapsibleSection
            title="Questions"
            icon={Sparkles}
            isOpen={showQuestions}
            onToggle={handleToggleQuestions}
          >
            <QuestionList
              questions={questions}
              onQuestionRelevance={onQuestionRelevance}
              onQuestionAnswer={onQuestionAnswer}
              containerRef={questionsContainerRef}
              originalPrompt={originalPrompt}
            />
          </CollapsibleSection>
        </div>

        <div ref={variablesContainerRef}>
          <CollapsibleSection
            title="Variables"
            icon={Sparkles}
            isOpen={showVariables}
            onToggle={handleToggleVariables}
          >
            <VariableList
              variables={variables}
              onVariableChange={onVariableChange}
              onVariableRelevance={onVariableRelevance}
              onAddVariable={onAddVariable}
              onDeleteVariable={onDeleteVariable}
              variableToDelete={variableToDelete}
              setVariableToDelete={setVariableToDelete}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Image Uploader"
            icon={Upload}
            isOpen={showImageUploader}
            onToggle={handleToggleImageUploader}
          >
            <ImageUploader 
              onImagesChange={() => {}}
              images={[]}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Web Scanner"
            icon={Globe}
            isOpen={showWebScanner}
            onToggle={handleToggleWebScanner}
          >
            <WebScanner 
              onWebsiteScan={() => {}}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Smart Context"
            icon={Sparkles}
            isOpen={showSmartContext}
            onToggle={handleToggleSmartContext}
          >
            <SmartContext 
              onSmartContext={() => {}}
            />
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
};

export { StepTwoContent };
export default StepTwoContent;
