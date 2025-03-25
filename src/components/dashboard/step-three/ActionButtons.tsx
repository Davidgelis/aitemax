
import { Button } from "@/components/ui/button";
import { Copy, Save, RefreshCw } from "lucide-react";

export interface ActionButtonsProps {
  handleCopyPrompt: () => void;
  handleSavePrompt: () => void;
  handleRegenerate?: () => void;
}

export const ActionButtons = ({
  handleCopyPrompt,
  handleSavePrompt,
  handleRegenerate
}: ActionButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      <Button 
        onClick={handleCopyPrompt}
        variant="outline"
        className="flex items-center gap-2 w-full"
      >
        <Copy className="h-4 w-4" />
        <span>Copy Prompt</span>
      </Button>
      
      <Button 
        onClick={handleSavePrompt}
        variant="default"
        className="flex items-center gap-2 bg-[#33fea6] hover:bg-[#28d88c] text-white w-full"
      >
        <Save className="h-4 w-4" />
        <span>Save Prompt</span>
      </Button>
      
      {handleRegenerate && (
        <Button 
          onClick={handleRegenerate}
          variant="outline"
          className="flex items-center gap-2 w-full"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Regenerate</span>
        </Button>
      )}
    </div>
  );
};
