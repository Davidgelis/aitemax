
import { ToggleSection } from "./ToggleSection";
import { PromptEditor } from "./PromptEditor";
import { Separator } from "@/components/ui/separator";
import { primaryToggles, secondaryToggles } from "./constants";

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
  const maxCharacterLimit = 3000; // Set the character limit to 3000

  return (
    <>
      <ToggleSection 
        toggles={primaryToggles} 
        selectedToggle={selectedPrimary} 
        onToggleChange={handlePrimaryToggle} 
        variant="primary"
        tooltipText="Select a primary use case for your prompt"
      />

      <Separator className="my-4" />

      <ToggleSection 
        toggles={secondaryToggles} 
        selectedToggle={selectedSecondary} 
        onToggleChange={handleSecondaryToggle} 
        variant="secondary"
        tooltipText="Select a secondary feature for your prompt"
      />

      <PromptEditor 
        promptText={promptText}
        setPromptText={setPromptText}
        onAnalyze={onAnalyze}
        selectedPrimary={selectedPrimary}
        selectedSecondary={selectedSecondary}
        isLoading={isLoading}
        maxLength={maxCharacterLimit}
      />
    </>
  );
};
