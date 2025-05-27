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
  promptText: string;
  setPromptText: (text: string) => void;
  variables: Array<{ id: string; name: string; description: string; placeholder: string; value: string }>;
  setVariables: (variables: Array<{ id: string; name: string; description: string; placeholder: string; value: string }>) => void;
  questions: Array<{ id: string; question: string; category: string; isAnswered: boolean; answer?: string }>;
  setQuestions: (questions: Array<{ id: string; question: string; category: string; isAnswered: boolean; answer?: string }>) => void;
  primaryToggle: string;
  setPrimaryToggle: (toggle: string) => void;
  secondaryToggle: string;
  setSecondaryToggle: (toggle: string) => void;
  masterCommand: string;
  setMasterCommand: (command: string) => void;
  onSave: (isManual?: boolean) => void;
  onNext: () => void;
  isSaving: boolean;
  isDirty: boolean;
  user: any;
}

const StepTwoContent: React.FC<StepTwoContentProps> = ({
  promptText,
  setPromptText,
  variables,
  setVariables,
  questions,
  setQuestions,
  primaryToggle,
  setPrimaryToggle,
  secondaryToggle,
  setSecondaryToggle,
  masterCommand,
  setMasterCommand,
  onSave,
  onNext,
  isSaving,
  isDirty,
  user
}) => {
  const [showQuestions, setShowQuestions] = useState(true);
  const [showVariables, setShowVariables] = useState(true);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showWebScanner, setShowWebScanner] = useState(false);
  const [showSmartContext, setShowSmartContext] = useState(false);
  const [isPromptEditorExpanded, setIsPromptEditorExpanded] = useState(true);
  const { toast } = useToast();
  const promptEditorRef = useRef<HTMLDivElement>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('');

  const { analysis } = usePromptAnalysis(promptText);

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

  const handleClearPrompt = () => {
    setPromptText('');
    setVariables([]);
    setQuestions([]);
    toast({
      title: "Prompt Cleared",
      description: "Your prompt has been cleared.",
    });
  };

  const handleInsertVariable = (variable: { name: string }) => {
    const newText = `${promptText} {{${variable.name}}}`;
    setPromptText(newText);
  };

  const handleInsertTag = (tag: string) => {
     const newText = `${promptText} #${tag}`;
     setPromptText(newText);
  };

  const handleEditorChange = (newText: string) => {
    setPromptText(newText);
  };

  const handleToggleExpandEditor = () => {
    setIsPromptEditorExpanded(!isPromptEditorExpanded);
  };

  const handleOpenCommandPalette = () => {
    setIsCommandPaletteOpen(true);
  };

  const handleCloseCommandPalette = () => {
    setIsCommandPaletteOpen(false);
    setCommandPaletteQuery('');
  };

  const handleCommandPaletteQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommandPaletteQuery(e.target.value);
  };

  const handleSelectCommand = (command: string) => {
    setMasterCommand(command);
    handleCloseCommandPalette();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Compose Your Prompt</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleClearPrompt}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button size="sm" onClick={onNext}>
            <Send className="w-4 h-4 mr-2" />
            Next
          </Button>
        </div>
      </div>

      <PromptEditor
        promptText={promptText}
        onChange={handleEditorChange}
        isExpanded={isPromptEditorExpanded}
        onToggleExpand={handleToggleExpandEditor}
        ref={promptEditorRef}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <ToggleSection
            title="Questions"
            icon={Sparkles}
            isOpen={showQuestions}
            onToggle={handleToggleQuestions}
          >
            <QuestionList
              questions={questions}
              setQuestions={setQuestions}
            />
          </ToggleSection>

          <ToggleSection
            title="Variables"
            icon={Sparkles}
            isOpen={showVariables}
            onToggle={handleToggleVariables}
          >
            <VariableList
              variables={variables}
              setVariables={setVariables}
              onInsertVariable={handleInsertVariable}
            />
          </ToggleSection>
        </div>

        <div>
          <ToggleSection
            title="Image Uploader"
            icon={Upload}
            isOpen={showImageUploader}
            onToggle={handleToggleImageUploader}
          >
            <ImageUploader />
          </ToggleSection>

          <ToggleSection
            title="Web Scanner"
            icon={Globe}
            isOpen={showWebScanner}
            onToggle={handleToggleWebScanner}
          >
            <WebScanner setPromptText={setPromptText} />
          </ToggleSection>

          <ToggleSection
            title="Smart Context"
            icon={Sparkles}
            isOpen={showSmartContext}
            onToggle={handleToggleSmartContext}
          >
            <SmartContext setPromptText={setPromptText} />
          </ToggleSection>
        </div>
      </div>
    </div>
  );
};

export default StepTwoContent;
