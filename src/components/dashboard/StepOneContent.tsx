
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

  // Show privacy notice on first visit
  useEffect(() => {
    const checkPrivacyNoticeShown = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('privacy_notice_shown')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (!data?.privacy_notice_shown) {
          setShowPrivacyNotice(true);
        }
      } catch (error) {
        console.error('Error checking privacy notice status:', error);
      }
    };
    
    checkPrivacyNoticeShown();
  }, [user]);

  // Mark privacy notice as shown
  const handleAcceptPrivacyNotice = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ privacy_notice_shown: true })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setShowPrivacyNotice(false);
    } catch (error) {
      console.error('Error updating privacy notice status:', error);
      toast({
        title: 'Error',
        description: 'Could not update privacy settings. Please try again.',
        variant: 'destructive',
      });
    }
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
          value={promptText} 
          onChange={setPromptText} 
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
        <PrivacyNoticePopup onAccept={handleAcceptPrivacyNotice} />
      )}
    </div>
  );
};

export default StepOneContent;
