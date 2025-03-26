
import { Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  const [isSaving, setIsSaving] = useState(false);
  
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
    if (isProcessing || isSaving) return;
    
    try {
      e.preventDefault();
      setIsProcessing(true);
      setIsSaving(true);
      
      toast({
        title: "Saving prompt",
        description: "Your prompt is being saved and analyzed for tags...",
      });
      
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
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex justify-between items-center">
      <Button
        onClick={safeHandleCopyPrompt}
        variant="aurora"
        disabled={isProcessing}
        aria-label="Copy prompt"
        className="gap-2"
      >
        <Copy className="w-4 h-4" />
        Copy
      </Button>
      <Button
        onClick={safeHandleSavePrompt}
        variant="aurora"
        disabled={isProcessing || isSaving}
        aria-label="Save prompt"
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        {isSaving ? "Saving & Generating Tags..." : "Save"}
      </Button>
    </div>
  );
};
