
import { PromptEditor } from "./PromptEditor";
import { TemplateSelector } from "./TemplateSelector";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface StepOneProps {
  promptText: string;
  setPromptText: (text: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const StepOne = ({
  promptText,
  setPromptText,
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle,
  onAnalyze,
  isLoading
}: StepOneProps) => {
  const { getCurrentTemplate, currentTemplate, systemState } = useTemplateManagement();
  const [showTemplateWarning, setShowTemplateWarning] = useState(false);
  
  useEffect(() => {
    // Log template info on component mount or template change
    const template = getCurrentTemplate();
    console.log("StepOne: Current template:", {
      templateId: template?.id,
      templateName: template?.name,
      pillarsCount: template?.pillars?.length,
      subId: systemState?.subId || 'none'
    });
    
    // Check if template has valid pillars
    const hasValidPillars = template && 
                           template.pillars && 
                           Array.isArray(template.pillars) && 
                           template.pillars.length > 0;
    
    setShowTemplateWarning(!hasValidPillars && !!template);
  }, [getCurrentTemplate, currentTemplate, systemState]);
  
  const handleAnalyze = () => {
    const currentTemplate = getCurrentTemplate();
    console.log("StepOne: Analyzing with template:", {
      templateId: currentTemplate?.id,
      templateName: currentTemplate?.name,
      pillarsCount: currentTemplate?.pillars?.length,
      subId: systemState?.subId || 'none'
    });
    
    if (!currentTemplate || !currentTemplate.pillars || !Array.isArray(currentTemplate.pillars) || currentTemplate.pillars.length === 0) {
      console.warn("StepOne: Invalid template structure for question generation");
    }
    
    onAnalyze();
  };
  
  return (
    <>
      <div className="mb-6">
        <TemplateSelector />
        
        {showTemplateWarning && (
          <Alert className="mt-4 border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-500" />
            <AlertTitle>Template configuration issue</AlertTitle>
            <AlertDescription>
              The selected template does not have properly configured pillars. Questions might not be generated correctly.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <PromptEditor 
        promptText={promptText}
        setPromptText={setPromptText}
        onAnalyze={handleAnalyze}
        selectedPrimary={selectedPrimary}
        selectedSecondary={selectedSecondary}
        isLoading={isLoading}
        maxLength={getCurrentTemplate()?.characterLimit || 3000}
      />
    </>
  );
};
