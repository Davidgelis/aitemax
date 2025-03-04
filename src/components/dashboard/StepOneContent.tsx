
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-6">
          <ModelSelector 
            onSelect={setSelectedModel} 
            selectedModel={selectedModel}
          />
          
          <div className="mt-6">
            <ToggleSection 
              toggles={primaryToggles} 
              selectedToggle={selectedPrimary} 
              onToggleChange={handlePrimaryToggle} 
              variant="primary"
              cols={2}
            />
          </div>
          
          <div className="mt-6">
            <ToggleSection 
              toggles={secondaryToggles} 
              selectedToggle={selectedSecondary} 
              onToggleChange={handleSecondaryToggle} 
              variant="secondary"
              cols={2}
            />
          </div>
        </div>
        
        <div className="md:col-span-6">
          <PromptEditor 
            promptText={promptText}
            setPromptText={setPromptText}
            onAnalyze={onAnalyze}
            selectedPrimary={selectedPrimary}
            selectedSecondary={selectedSecondary}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
