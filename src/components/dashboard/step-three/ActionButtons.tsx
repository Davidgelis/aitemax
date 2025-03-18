
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Save, RotateCw } from "lucide-react";

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
  setIsPrivate = () => {},
  onRegenerate
}) => {
  return (
    <div className="flex justify-between items-center mt-4">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex items-center gap-2 border-teal-800 bg-white hover:bg-teal-50 text-teal-800 px-4 py-2 rounded" 
          onClick={onCopyPrompt}
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>Copy</span>
        </Button>
        
        {onRegenerate && (
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-teal-800 bg-white hover:bg-teal-50 text-teal-800 px-4 py-2 rounded" 
            onClick={onRegenerate}
          >
            <RotateCw className="h-4 w-4" />
            <span>Regenerate</span>
          </Button>
        )}
      </div>
      
      <Button 
        className="flex items-center gap-2 bg-teal-800 text-white hover:bg-teal-700 px-4 py-2 rounded" 
        onClick={onSavePrompt}
      >
        <Save className="h-4 w-4" />
        <span>Save</span>
      </Button>
    </div>
  );
};
