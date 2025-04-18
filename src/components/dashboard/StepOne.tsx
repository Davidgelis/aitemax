import { PromptEditor } from "./PromptEditor";
import { TemplateSelector } from "./TemplateSelector";
import { TemplateType } from "../x-templates/XTemplateCard";
import { useState, useEffect } from "react";

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
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  
  // Initialize with the default template
  useEffect(() => {
    // This is handled by the TemplateSelector component now
  }, []);

  return (
    <>
      <div className="mb-6">
        <TemplateSelector />
      </div>

      <PromptEditor 
        promptText={promptText}
        setPromptText={setPromptText}
        onAnalyze={onAnalyze}
        selectedPrimary={selectedPrimary}
        selectedSecondary={selectedSecondary}
        isLoading={isLoading}
        maxLength={selectedTemplate?.characterLimit || 3000}
      />
    </>
  );
};
