
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Info } from 'lucide-react';

interface WebScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebsiteScan: (url: string, instructions: string) => void;
  savedUrl?: string;
  savedInstructions?: string;
}

export const WebScanDialog = ({
  open,
  onOpenChange,
  onWebsiteScan,
  savedUrl = '',
  savedInstructions = ''
}: WebScanDialogProps) => {
  const [url, setUrl] = useState(savedUrl);
  const [instructions, setInstructions] = useState(savedInstructions);
  
  // Update state when props change
  useEffect(() => {
    if (open) {
      setUrl(savedUrl);
      setInstructions(savedInstructions);
    }
  }, [open, savedUrl, savedInstructions]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onWebsiteScan(url.trim(), instructions.trim());
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-[#084b49]/30 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-medium text-[#545454]">Web Smart Scan</DialogTitle>
          <p className="text-sm text-[#545454] font-normal mt-1">Use website content as context for your prompt</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          <div className="mb-4">
            <label htmlFor="website-url" className="block text-sm font-medium text-[#545454] mb-2">
              Website URL
            </label>
            <Input 
              id="website-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border-[#084b49]/30"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="instructions" className="block text-sm font-medium text-[#545454] mb-2">
              What to extract from this website
            </label>
            <Textarea 
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., 'Extract best practices for UI design' or 'Find information about pricing models'"
              className="w-full min-h-[120px] border-[#084b49]/30 resize-none"
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-[#545454]/80">
              <Info size={14} className="flex-shrink-0" />
              <p>
                Be specific about what information you want extracted. For example:
                "Find all best practices for SEO", "Extract the key features and benefits", 
                or "Identify the pricing structure and options".
              </p>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button
              type="submit"
              className="bg-[#084b49] hover:bg-[#084b49]/90 text-white px-4 py-2"
            >
              Save Response
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
