
import { ToggleSection } from "./ToggleSection";
import { PromptEditor } from "./PromptEditor";
import { Separator } from "@/components/ui/separator";
import { primaryToggles, secondaryToggles } from "./constants";
import { ModelSelector } from "./model-selector";
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
  selectedCognitive: string | null;
  handleCognitiveToggle: (id: string) => void;
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
  setSelectedModel,
  selectedCognitive,
  handleCognitiveToggle
}: StepOneContentProps) => {
  const cognitiveTooltip = 
    "This button will conduct a final precision-driven refinement of the generated prompt as a second layer of refinment, ensuring you receive the best possible prompt by eliminating ambiguities, reinforcing clarity, and ensuring domain-specific accuracy for optimal task execution.";
  
  const cognitiveToggle = [{ label: "Cognitive Prompt Perfection Model", id: "cognitive" }];
  
  return (
    <div className="space-y-4 w-full">
      <div className="w-full">
        <div className="flex justify-between items-center">
          <ModelSelector 
            onSelect={setSelectedModel} 
            selectedModel={selectedModel}
          />
          
          {/* Container with flex to position toggle and help icon properly */}
          <div className="flex items-center">
            <ToggleSection 
              toggles={cognitiveToggle} 
              selectedToggle={selectedCognitive} 
              onToggleChange={handleCognitiveToggle}
              variant="aurora"
              tooltipText={cognitiveTooltip}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <ToggleSection 
            toggles={primaryToggles} 
            selectedToggle={selectedPrimary} 
            onToggleChange={handlePrimaryToggle} 
            variant="primary"
          />
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <ToggleSection 
            toggles={secondaryToggles} 
            selectedToggle={selectedSecondary} 
            onToggleChange={handleSecondaryToggle} 
            variant="secondary"
          />
        </div>
        
        <div className="mt-6">
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
