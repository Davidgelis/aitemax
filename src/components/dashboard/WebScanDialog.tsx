
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onWebsiteScan(url.trim(), instructions.trim());
      onOpenChange(false);
      // Reset the form after submission
      setUrl('');
      setInstructions('');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-[#084b49]/30 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-medium text-[#545454]">Edit Response</DialogTitle>
          <p className="text-sm text-[#545454] font-normal mt-1">Provide your answer to this question</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          <div className="mb-4">
            <label htmlFor="website-url" className="block text-sm font-medium text-[#545454] mb-2">
              What is the desired tone of the output?
            </label>
            <Input 
              id="website-url"
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full min-h-[160px] border-[#084b49]/30 resize-none"
              required
              multiline="true"
              as="textarea"
            />
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
