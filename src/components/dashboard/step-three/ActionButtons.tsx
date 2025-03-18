
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Save, RefreshCw } from "lucide-react";
import { PrivacyCheckbox } from "@/components/dashboard/PrivacyCheckbox";

interface ActionButtonsProps {
  onCopyPrompt: () => void;
  onSavePrompt: () => void;
  onRegenerate: () => void;
  isCopied?: boolean;
  isPrivate?: boolean;
  setIsPrivate?: (isPrivate: boolean) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCopyPrompt,
  onSavePrompt,
  onRegenerate,
  isCopied = false,
  isPrivate = false,
  setIsPrivate = () => {}
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="hidden sm:block">
        <PrivacyCheckbox
          isPrivate={isPrivate}
          onChange={setIsPrivate}
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <Button 
          variant="outline" 
          className="flex items-center gap-1 bg-white shadow-sm" 
          onClick={onCopyPrompt}
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>Copy</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-1 bg-white shadow-sm" 
          onClick={onRegenerate}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Regenerate</span>
        </Button>
        
        <Button 
          className="flex items-center gap-1 bg-[#084b49] text-white hover:bg-[#084b49]/90" 
          onClick={onSavePrompt}
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </Button>
      </div>
    </div>
  );
};
