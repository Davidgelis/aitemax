
import { Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ActionButtonsProps {
  handleCopyPrompt: () => void;
  handleSavePrompt: () => void;
}

export const ActionButtons = ({
  handleCopyPrompt,
  handleSavePrompt
}: ActionButtonsProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const safeHandleCopyPrompt = async (e: React.MouseEvent) => {
    if (isProcessing) return;
    
    try {
      e.preventDefault();
      setIsProcessing(true);
      
      if (typeof handleCopyPrompt === 'function') {
        await handleCopyPrompt();
      } else {
        throw new Error("Copy function is not defined");
      }
    } catch (error) {
      console.error("Error copying prompt:", error);
      toast({
        title: "Error copying prompt",
        description: "An error occurred while trying to copy the prompt",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const safeHandleSavePrompt = async (e: React.MouseEvent) => {
    if (isProcessing) return;
    
    try {
      e.preventDefault();
      setIsProcessing(true);
      
      if (typeof handleSavePrompt === 'function') {
        await handleSavePrompt();
      } else {
        throw new Error("Save function is not defined");
      }
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        title: "Error saving prompt",
        description: "An error occurred while trying to save the prompt",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex justify-between items-center">
      <button
        onClick={safeHandleCopyPrompt}
        className="aurora-button inline-flex items-center gap-2"
        disabled={isProcessing}
        aria-label="Copy prompt"
      >
        <Copy className="w-4 h-4" />
        Copy
      </button>
      <button
        onClick={safeHandleSavePrompt}
        className="aurora-button inline-flex items-center gap-2"
        disabled={isProcessing}
        aria-label="Save prompt"
      >
        <Save className="w-4 h-4" />
        Save
      </button>
    </div>
  );
};
