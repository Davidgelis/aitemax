
import { useState, useEffect } from 'react';
import { PromptEditor } from './PromptEditor';
import { PrivacyNoticePopup } from './PrivacyNoticePopup';
import { usePromptState } from '@/hooks/usePromptState';
import { usePromptTemplates } from '@/hooks/usePromptTemplates';
import { TemplateSelector } from './TemplateSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StepOneContentProps {
  user: any;
  promptText: string;
  setPromptText: (text: string) => void;
  handleAnalyze: () => void;
  isLoading: boolean;
}

const StepOneContent = ({
  user,
  promptText,
  setPromptText,
  handleAnalyze,
  isLoading,
}: StepOneContentProps) => {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const { toast } = useToast();
  
  // Get templates
  const { 
    templates, 
    isLoading: templatesLoading, 
    selectedTemplate, 
    setSelectedTemplate 
  } = usePromptTemplates(user?.id);

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
  };

  // Show privacy notice on first visit - using localStorage instead
  useEffect(() => {
    if (!user) return;
    
    // Check if privacy notice has been shown before using localStorage
    const privacyNoticeShown = localStorage.getItem(`privacy_notice_shown_${user.id}`);
    
    if (!privacyNoticeShown) {
      setShowPrivacyNotice(true);
    }
  }, [user]);

  // Mark privacy notice as shown using localStorage
  const handleAcceptPrivacyNotice = () => {
    if (!user) return;
    
    // Store in localStorage that privacy notice has been shown
    localStorage.setItem(`privacy_notice_shown_${user.id}`, 'true');
    setShowPrivacyNotice(false);
  };

  return (
    <div className="space-y-6">
      <div className="md:w-2/3 mx-auto space-y-6">
        <h2 className="text-xl font-bold text-center">What would you like the AI to do?</h2>
        
        <p className="text-muted-foreground text-center">
          Enter your prompt below. We'll analyze it and help you refine it for better results.
        </p>
        
        {/* Template Selector */}
        <div className="mb-4">
          <TemplateSelector
            templates={templates}
            selectedTemplate={selectedTemplate}
            isLoading={templatesLoading}
            onSelectTemplate={handleSelectTemplate}
          />
        </div>
        
        <PromptEditor 
          content={promptText} 
          setContent={setPromptText} 
          placeholder="Enter your prompt here..."
          maxHeight="300px"
        />
        
        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !promptText.trim()}
            className="p-2 px-4 bg-accent hover:bg-accent/80 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Prompt'}
          </button>
        </div>
      </div>
      
      {showPrivacyNotice && (
        <PrivacyNoticePopup 
          user={user} 
          currentStep={1} 
        />
      )}
    </div>
  );
};

export default StepOneContent;
