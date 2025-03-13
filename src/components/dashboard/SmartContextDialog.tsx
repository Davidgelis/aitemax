
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface SmartContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSmartContext: (context: string) => void;
  onDeleteContext?: () => void;
  savedContext?: string;
  hasContext?: boolean;
}

export const SmartContextDialog = ({
  open,
  onOpenChange,
  onSmartContext,
  onDeleteContext,
  savedContext = '',
  hasContext = false
}: SmartContextDialogProps) => {
  const [context, setContext] = useState(savedContext);
  const { toast } = useToast();
  
  // Update local state when props change
  useEffect(() => {
    if (open) {
      setContext(savedContext);
    }
  }, [open, savedContext]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!context.trim()) {
      toast({
        title: "Context required",
        description: "Please provide specific context to enhance your prompt.",
        variant: "destructive"
      });
      return;
    }
    
    // Process the data and close the dialog
    onSmartContext(context.trim());
    onOpenChange(false);
  };
  
  const handleDialogClose = (open: boolean) => {
    // If closing and fields are filled, prompt user
    if (!open && context.trim() && !savedContext) {
      toast({
        title: "Discard changes?",
        description: "You have unsaved changes that will be lost.",
      });
    }
    onOpenChange(open);
  };
  
  const handleDelete = () => {
    if (onDeleteContext) {
      onDeleteContext();
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md bg-white border border-[#084b49]/30 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-medium text-[#545454]">Smart Context</DialogTitle>
          <p className="text-sm text-[#545454] font-normal mt-1">Use specific context to enhance your original prompt</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          <div className="mb-4">
            <label htmlFor="context" className="block text-sm font-medium text-[#545454] mb-2">
              What specific context do you want to add? <span className="text-red-500">*</span>
            </label>
            <Textarea 
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="E.g., 'This is for a technical audience' or 'The tone should be professional'."
              className={`w-full min-h-[200px] resize-none ${!context.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
              required
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-[#545454]/80">
              <Info size={14} className="flex-shrink-0" />
              <p>
                Be specific about what context you want to add to enhance your prompt. For example:
                "This is for a financial audience", "The tone should be conversational",
                or "Focus on highlighting environmental benefits".
              </p>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            {hasContext && (
              <Button
                type="button"
                onClick={handleDelete}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-600"
                size="sm"
              >
                Delete
              </Button>
            )}
            
            <div className={`flex ml-auto ${hasContext ? 'gap-2' : ''}`}>
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="mr-2 bg-transparent hover:bg-gray-100 text-[#545454]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#084b49] hover:bg-[#084b49]/90 text-white px-4 py-2"
              >
                Use as Context
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
