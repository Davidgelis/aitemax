
import { Copy, Save } from "lucide-react";

interface ActionButtonsProps {
  handleCopyPrompt: () => void;
  handleSavePrompt: () => void;
}

export const ActionButtons = ({
  handleCopyPrompt,
  handleSavePrompt
}: ActionButtonsProps) => {
  return (
    <div className="flex justify-between items-center">
      <button
        onClick={handleCopyPrompt}
        className="aurora-button inline-flex items-center gap-2"
      >
        <Copy className="w-4 h-4" />
        Copy
      </button>
      <button
        onClick={handleSavePrompt}
        className="aurora-button inline-flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        Save
      </button>
    </div>
  );
};
