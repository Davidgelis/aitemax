
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Save } from "lucide-react";

interface ActionButtonsProps {
  onCopyPrompt: () => void;
  onSavePrompt: () => void;
  onRegenerate?: () => void;
  isCopied?: boolean;
  isPrivate?: boolean;
  setIsPrivate?: (isPrivate: boolean) => void;
  useAuroraEffect?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCopyPrompt,
  onSavePrompt,
  isCopied = false,
  isPrivate = false,
  setIsPrivate = () => {}
}) => {
  return (
    <div className="flex justify-between items-center mt-4">
      <Button 
        variant="aurora" 
        className="flex items-center gap-2 px-4 py-2 rounded" 
        onClick={onCopyPrompt}
      >
        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span>Copy</span>
      </Button>
      
      <Button 
        variant="aurora"
        className="flex items-center gap-2 px-4 py-2 rounded" 
        onClick={onSavePrompt}
      >
        <Save className="h-4 w-4" />
        <span>Save</span>
      </Button>
    </div>
  );
};
