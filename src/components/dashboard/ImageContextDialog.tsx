
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';

interface ImageContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (context: string) => void;
  savedContext?: string;
  imageName?: string;
}

export const ImageContextDialog = ({
  open,
  onOpenChange,
  onConfirm,
  savedContext = '',
  imageName = ''
}: ImageContextDialogProps) => {
  const [context, setContext] = useState(savedContext);
  
  // Update state when props change
  useEffect(() => {
    if (open) {
      setContext(savedContext);
    }
  }, [open, savedContext]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(context.trim());
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-[#084b49]/30 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-medium text-[#545454]">Image Context</DialogTitle>
          <p className="text-sm text-[#545454] font-normal mt-1">
            Add specific instructions on how to analyze this image
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
            </label>
            <Textarea 
              id="instructions"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="E.g., 'Focus on the composition techniques' or 'Identify key elements in the foreground'"
              className="w-full min-h-[120px] border-[#084b49]/30 resize-none"
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-[#545454]/80">
              <Info size={14} className="flex-shrink-0" />
              <p>
                Be specific about what you want analyzed in this image. For example:
                "Describe the lighting techniques used", "Identify the style and mood of this composition", 
                or "Focus on the color palette and how it creates atmosphere".
              </p>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button
              type="submit"
              className="bg-[#084b49] hover:bg-[#084b49]/90 text-white px-4 py-2"
            >
              Use as Context
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
