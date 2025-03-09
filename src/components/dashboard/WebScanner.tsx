
import { useState } from 'react';
import { Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { WebScanDialog } from './WebScanDialog';

interface WebScannerProps {
  onWebsiteScan: (url: string, instructions: string) => void;
}

export const WebScanner = ({ onWebsiteScan }: WebScannerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleWebsiteScan = (url: string, instructions: string) => {
    onWebsiteScan(url, instructions);
    toast({
      title: "Website scan initiated",
      description: "The content from the website will be used as context",
    });
  };
  
  return (
    <div className="flex flex-col">
      <div className="mb-2">
        <button
          onClick={() => setDialogOpen(true)}
          className="p-2 rounded-md border-2 border-[#64bf95] text-[#64bf95] hover:bg-[#64bf95]/10 transition-colors flex items-center gap-1"
          title="Scan website"
        >
          <Globe className="w-5 h-5" />
          <span className="text-sm">Web Smart Scan</span>
        </button>
      </div>
      
      <WebScanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onWebsiteScan={handleWebsiteScan}
      />
    </div>
  );
};
