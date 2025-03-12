
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Info, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface WebScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebsiteScan: (url: string, instructions: string) => void;
  onDeleteScan?: () => void;
  savedUrl?: string;
  savedInstructions?: string;
  hasContext?: boolean;
}

export const WebScanDialog = ({
  open,
  onOpenChange,
  onWebsiteScan,
  onDeleteScan,
  savedUrl = '',
  savedInstructions = '',
  hasContext = false
}: WebScanDialogProps) => {
  const [url, setUrl] = useState(savedUrl);
  const [instructions, setInstructions] = useState(savedInstructions);
  const { toast } = useToast();
  
  // Update state when props change
  useEffect(() => {
    if (open) {
      setUrl(savedUrl);
      setInstructions(savedInstructions);
    }
  }, [open, savedUrl, savedInstructions]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please provide a website URL.",
        variant: "destructive"
      });
      return;
    }
    
    if (!instructions.trim()) {
      toast({
        title: "Context required",
        description: "Please provide specific instructions for what information to extract from this website.",
        variant: "destructive"
      });
      return;
    }
    
    // Process the data and close the dialog
    onWebsiteScan(url.trim(), instructions.trim());
    onOpenChange(false);
  };
  
  const handleDialogClose = (open: boolean) => {
    // If closing and fields are filled, prompt user
    if (!open && (url.trim() || instructions.trim())) {
      if (!savedUrl && !savedInstructions) {
        toast({
          title: "Discard changes?",
          description: "You have unsaved changes that will be lost.",
        });
      }
    }
    onOpenChange(open);
  };
  
  const handleDelete = () => {
    if (onDeleteScan) {
      onDeleteScan();
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md bg-white border border-[#084b49]/30 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-medium text-[#545454]">Web Smart Scan</DialogTitle>
          <p className="text-sm text-[#545454] font-normal mt-1">Use website content to enhance your original prompt</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          <div className="mb-4">
            <label htmlFor="website-url" className="block text-sm font-medium text-[#545454] mb-2">
              Website URL <span className="text-red-500">*</span>
            </label>
            <Input 
              id="website-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={`w-full ${!url.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="instructions" className="block text-sm font-medium text-[#545454] mb-2">
              What specific information do you want from this website? <span className="text-red-500">*</span>
            </label>
            <Textarea 
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., 'Extract best practices for landing pages' or 'Find information about pricing models'"
              className={`w-full min-h-[120px] resize-none ${!instructions.trim() ? 'border-red-500' : 'border-[#084b49]/30'}`}
              required
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-[#545454]/80">
              <Info size={14} className="flex-shrink-0" />
              <p>
                Be specific about what information you want extracted to enhance your prompt. For example:
                "Find all best practices for landing page design", "Extract key features of successful SaaS websites", 
                or "Identify pricing structure patterns used by competitors".
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
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
            
            <div className={`flex ml-auto ${hasContext ? 'gap-2' : ''}`}>
              <Button
                type="submit"
                className="bg-[#084b49] hover:bg-[#084b49]/90 text-white px-4 py-2 shadow-[0_0_0_0_#33fea6] transition-all duration-300 hover:shadow-[0_0_10px_0_#33fea6]"
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
