
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareText } from "lucide-react";

interface SmartContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSmartContext: (context: string) => void;
  savedContext?: string;
  hasContext?: boolean;
}

export const SmartContextDialog = ({
  open,
  onOpenChange,
  onSmartContext,
  savedContext = '',
  hasContext = false
}: SmartContextDialogProps) => {
  const [context, setContext] = useState(savedContext);
  
  // Update local state when props change
  useEffect(() => {
    setContext(savedContext);
  }, [savedContext]);

  const handleSubmit = () => {
    onSmartContext(context);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Smart Context</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Add specific context that will be used to enhance your prompt. For example: 'This is for a technical audience' or 'The tone should be professional'."
            className="min-h-[200px]"
            showCount
            maxCount={1000}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="aurora" onClick={handleSubmit} disabled={!context.trim()}>
            Apply Context
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
