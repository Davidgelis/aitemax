
import { ToggleSection } from "./ToggleSection";
import { PromptEditor } from "./PromptEditor";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "./types";

interface StepOneProps {
  promptText: string;
  setPromptText: (text: string) => void;
  selectedPrimary: string | null;
  setSelectedPrimary: (id: string | null) => void;
  selectedSecondary: string | null;
  setSelectedSecondary: (id: string | null) => void;
  primaryToggles: Toggle[];
  secondaryToggles: Toggle[];
  onAnalyze: () => void;
  isLoading: boolean;
}

export const StepOne = ({
  promptText,
  setPromptText,
  selectedPrimary,
  setSelectedPrimary,
  selectedSecondary,
  setSelectedSecondary,
  primaryToggles,
  secondaryToggles,
  onAnalyze,
  isLoading
}: StepOneProps) => {
  const maxCharacterLimit = 3000;
  
  const handlePrimaryToggle = (id: string) => {
    setSelectedPrimary(id === selectedPrimary ? null : id);
  };
  
  const handleSecondaryToggle = (id: string) => {
    setSelectedSecondary(id === selectedSecondary ? null : id);
  };

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
