
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info, Image } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ImageContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (context: string) => void;
  savedContext?: string;
  imageName?: string;
  required?: boolean;
}

export const ImageContextDialog = ({
  open,
  onOpenChange,
  onConfirm,
  savedContext = '',
  imageName = '',
  required = false
}: ImageContextDialogProps) => {
  const [context, setContext] = useState(savedContext);
  const { toast } = useToast();
  
  // Update state when props change
  useEffect(() => {
    if (open) {
      setContext(savedContext);
    }
  }, [open, savedContext]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If context is required and empty, show an error
    if (required && !context.trim()) {
      toast({
        title: "Context required",
        description: "Please provide context for how to analyze this image.",
        variant: "destructive"
      });
      return;
    }
    
    onConfirm(context.trim());
    onOpenChange(false);
  };
  
  const handleDialogClose = (open: boolean) => {
    // If closing and context is required but not provided, prevent closing
    if (!open && required && !context.trim() && !savedContext.trim()) {
      toast({
        title: "Context required",
        description: "Please provide context for how to analyze this image.",
        variant: "destructive"
      });
      return;
    }
    
    onOpenChange(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md bg-white border border-[#084b49]/30 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-medium text-[#545454] flex items-center gap-2">
            <Image className="w-5 h-5 text-[#084b49]" />
            Image Context
          </DialogTitle>
          <p className="text-sm text-[#545454] font-normal mt-1">
            {required ? 
              "Add specific instructions on how to analyze this image (required)" :
              "Add specific instructions on how to analyze this image"
            }
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          <div className="mb-4">
            <label htmlFor="image-name" className="block text-sm font-medium text-[#545454] mb-2">
              Image
            </label>
            <div className="p-2 border border-[#084b49]/30 rounded-md bg-gray-50">
              {imageName || "Uploaded image"}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="instructions" className="block text-sm font-medium text-[#545454] mb-2">
              What specific details should be analyzed in this image?
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Textarea 
              id="instructions"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="E.g., 'Focus on the lighting techniques' or 'Analyze the composition style'"
              className={`w-full min-h-[120px] resize-none ${required && !context.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
              required={required}
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-[#545454]/80">
              <Info size={14} className="flex-shrink-0" />
              <p>
                Your prompt will be combined with this context. Be specific about what aspects you want analyzed in this image, as this will guide the AI's focus.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            {!required && (
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="mr-2 bg-transparent hover:bg-gray-100 text-[#545454]"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="bg-[#084b49] hover:bg-[#084b49]/90 text-white px-4 py-2"
            >
              {savedContext ? 'Update Context' : 'Add Context'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
