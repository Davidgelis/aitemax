
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface WebScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebsiteScan: (url: string, instructions: string) => void;
}

export const WebScanDialog = ({
  open,
  onOpenChange,
  onWebsiteScan
}: WebScanDialogProps) => {
  const [url, setUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onWebsiteScan(url.trim(), instructions.trim());
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md border border-[#084b49]/30">
        <form onSubmit={handleSubmit}>
          <div 
            className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl transition-colors ${
              isDragging ? 'border-[#33fea6] bg-[#33fea6]/5' : 'border-[#084b49] bg-transparent'
            }`}
          >
            <Globe 
              className="w-16 h-16 mb-4 text-[#084b49]"
            />
            
            <p className="text-center mb-6 text-[#545454]">
              Enter a website URL to scan and use as context
            </p>
            
            <div className="w-full space-y-4">
              <div>
                <label htmlFor="website-url" className="block text-sm font-medium text-[#545454] mb-1">
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
              
              <div>
                <label htmlFor="instructions" className="block text-sm font-medium text-[#545454] mb-1">
                  How to use this website (optional)
                </label>
                <textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Provide any specific instructions about how to use this website as context"
                  className="w-full h-20 p-2 border border-[#084b49]/30 rounded-md resize-none outline-none focus:ring-2 focus:ring-[#084b49]/50 transition-all text-[#545454]"
                />
              </div>
              
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="aurora-button flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Scan Website
                </button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
