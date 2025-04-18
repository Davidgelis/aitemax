
import { PromptEditor } from "./PromptEditor";
import { TemplateSelector } from "./TemplateSelector";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";

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
  const { currentTemplate } = useTemplateManagement();
  
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
        maxLength={currentTemplate?.characterLimit || 3000}
      />
    </>
  );
};
