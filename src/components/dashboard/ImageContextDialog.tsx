
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';

interface ImageContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (context: string) => void;
  imageName?: string;
  savedContext?: string;
  required?: boolean;
  stayOnCurrentStep?: boolean;
  isProcessingContext?: boolean;
}

export const ImageContextDialog = ({
  open,
  onOpenChange,
  onConfirm,
  imageName = "image",
  savedContext = "",
  required = false,
  stayOnCurrentStep = false,
  isProcessingContext = false
}: ImageContextDialogProps) => {
  const [context, setContext] = useState(savedContext);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (required && !context.trim()) {
      return;
    }
    
    onConfirm(context);
  };
  
  const handleDialogChange = (open: boolean) => {
    // If the dialog is opening, initialize with saved context
    if (open) {
      setContext(savedContext);
    } else if (!open && stayOnCurrentStep && isProcessingContext) {
      // If we're closing and need to stay on current step, prevent default close behavior
      console.log("ImageContextDialog: Staying on current step due to context processing");
      return;
    }
    
    onOpenChange(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-[#545454]">Image Analysis Instructions</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label htmlFor="context" className="text-sm font-medium text-[#545454] mb-2 block">
              What specific aspects of this image should the AI analyze?
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Textarea 
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="E.g., 'Analyze colors, composition, and subject matter' or 'Focus on lighting and mood'"
              className={`w-full min-h-[120px] resize-none ${required && !context.trim() ? 'border-red-500' : 'border-[#e5e7eb]'}`}
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-[#545454]/80">
              <Info size={14} className="flex-shrink-0" />
              <p>
                Your instructions help the AI understand what to focus on when analyzing this image.
                Be specific about colors, style, composition, mood, subject matter or any other elements
                you want emphasized in the analysis.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mr-2 bg-transparent hover:bg-gray-100 text-[#545454]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#084b49] hover:bg-[#084b49]/90 text-white"
              disabled={required && !context.trim()}
            >
              Add Context
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
