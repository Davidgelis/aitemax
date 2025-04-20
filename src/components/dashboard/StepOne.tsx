
import { PromptEditor } from "./PromptEditor";
import { TemplateSelector } from "./TemplateSelector";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { useEffect } from "react";

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
  const { getCurrentTemplate, currentTemplate } = useTemplateManagement();
  
  useEffect(() => {
    // Log template info on component mount
    const template = getCurrentTemplate();
    console.log("StepOne: Current template:", {
      templateId: template?.id,
      templateName: template?.name,
      pillarsCount: template?.pillars?.length
    });
  }, [getCurrentTemplate, currentTemplate]);
  
  const handleAnalyze = () => {
    const currentTemplate = getCurrentTemplate();
    console.log("StepOne: Analyzing with template:", {
      templateId: currentTemplate?.id,
      templateName: currentTemplate?.name,
      pillarsCount: currentTemplate?.pillars?.length
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
