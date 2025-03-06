
import { Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActionButtonsProps {
  handleCopyPrompt: () => void;
  handleSavePrompt: () => void;
}

export const ActionButtons = ({
  handleCopyPrompt,
  handleSavePrompt
}: ActionButtonsProps) => {
  const { toast } = useToast();
  
  const safeHandleCopyPrompt = () => {
    try {
      handleCopyPrompt();
    } catch (error) {
      console.error("Error copying prompt:", error);
      toast({
        title: "Error copying prompt",
        description: "An error occurred while trying to copy the prompt",
        variant: "destructive"
      });
    }
  };
  
  const safeHandleSavePrompt = () => {
    try {
      handleSavePrompt();
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        title: "Error saving prompt",
        description: "An error occurred while trying to save the prompt",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex justify-between items-center">
      <button
        onClick={safeHandleCopyPrompt}
        className="aurora-button inline-flex items-center gap-2"
      >
        <Copy className="w-4 h-4" />
        Copy
      </button>
      <button
        onClick={safeHandleSavePrompt}
        className="aurora-button inline-flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        Save
      </button>
    </div>
  );
};
