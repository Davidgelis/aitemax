
import { ToggleSection } from "./ToggleSection";
import { PromptEditor } from "./PromptEditor";
import { Separator } from "@/components/ui/separator";
import { primaryToggles, secondaryToggles } from "./constants";
import { ModelSelector } from "./ModelSelector";
import { AIModel } from "./types";

interface StepOneContentProps {
  promptText: string;
  setPromptText: (text: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel | null) => void;
}

export const StepOneContent = ({
  promptText,
  setPromptText,
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle,
  onAnalyze,
  isLoading,
  selectedModel,
  setSelectedModel
}: StepOneContentProps) => {
  return (
    <div className="space-y-6 w-full">
      <div className="max-w-md w-full mx-auto">
        <ModelSelector 
          onSelect={setSelectedModel} 
          selectedModel={selectedModel}
        />
      </div>
      
      <Separator className="my-4" />
      
      <ToggleSection 
        toggles={primaryToggles} 
        selectedToggle={selectedPrimary} 
        onToggleChange={handlePrimaryToggle} 
        variant="primary"
        cols={4}
      />

      <Separator className="my-4" />

      <ToggleSection 
        toggles={secondaryToggles} 
        selectedToggle={selectedSecondary} 
        onToggleChange={handleSecondaryToggle} 
        variant="secondary"
        cols={3}
      />

      <PromptEditor 
        promptText={promptText}
        setPromptText={setPromptText}
        onAnalyze={onAnalyze}
        selectedPrimary={selectedPrimary}
        selectedSecondary={selectedSecondary}
        isLoading={isLoading}
      />
    </div>
  );
};
