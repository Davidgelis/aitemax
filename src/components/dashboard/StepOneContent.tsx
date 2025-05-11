
import { ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { AIModel } from "./types";

/**  UI shown in *Step 1*
 *   (prompt text-area, feature toggles, and the "Analyze" button)               */

type Props = {
  promptText: string;
  setPromptText: (txt: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  /* additional props (images / website / smart-context) already passed
     through StepController but are optional for the basic UI */
  selectedModel?: AIModel | null;
  setSelectedModel?: (model: AIModel | null) => void;
  selectedCognitive?: string | null;
  handleCognitiveToggle?: (id: string) => void;
  onImagesChange?: (files: any[]) => void;
  onWebsiteScan?: (url: string, instructions: string) => void;
  onSmartContext?: (ctx: string, usage: string) => void;
  setPreventStepChange?: (b: boolean) => void;
};

export const StepOneContent = ({
  promptText,
  setPromptText,
  onAnalyze,
  isLoading,
}: Props) => {
  /* simple controlled textarea */
  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
    setPromptText(e.target.value);

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <textarea
        className="w-full flex-1 resize-none p-4 rounded-md border"
        placeholder="Describe what you'd like to create…"
        value={promptText}
        onChange={onChange}
        disabled={isLoading}
      />

      <button
        className="aurora-button self-end"
        onClick={onAnalyze}
        disabled={isLoading || !promptText.trim()}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </span>
        ) : (
          "Analyze"
        )}
      </button>
    </div>
  );
};
