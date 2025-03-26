
import { Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  finalPrompt: string;
  onBack: () => void;
}

export const ActionButtons = ({
  finalPrompt,
  onBack
}: ActionButtonsProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleCopyPrompt = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await navigator.clipboard.writeText(finalPrompt);
      toast({
        title: "Copied to clipboard",
        description: "The prompt has been copied to your clipboard"
      });
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
  
  const handleSavePrompt = async () => {
    if (isProcessing || isSaving) return;
    
    try {
      setIsProcessing(true);
      setIsSaving(true);
      
      toast({
        title: "Saving prompt",
        description: "Your prompt is being saved and analyzed for tags...",
      });
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Prompt saved",
        description: "Your prompt has been saved successfully"
      });
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
        onClick={onBack}
        variant="outline"
        className="gap-2"
      >
        Back
      </Button>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handleCopyPrompt}
          variant="aurora"
          disabled={isProcessing}
          aria-label="Copy prompt"
          className="gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy
        </Button>
        <Button
          onClick={handleSavePrompt}
          variant="aurora"
          disabled={isProcessing || isSaving}
          aria-label="Save prompt"
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
