
import { useState } from 'react';
import { Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { WebScanDialog } from './WebScanDialog';

interface WebScannerProps {
  onWebsiteScan: (url: string, instructions: string) => void;
  variant?: 'default' | 'modelReplacement';
  className?: string;
}

export const WebScanner = ({ 
  onWebsiteScan, 
  variant = 'default', 
  className = '' 
}: WebScannerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');
  const [savedInstructions, setSavedInstructions] = useState('');
  
  const handleWebsiteScan = (url: string, instructions: string) => {
    // Save the values for persistence
    setSavedUrl(url);
    setSavedInstructions(instructions);
    
    // Call the parent handler without modifying any text area
    onWebsiteScan(url, instructions);
    
    toast({
      title: "Website scan initiated",
      description: "The content from the website will be used as context",
    });
  };

  // Model replacement style button
  if (variant === 'modelReplacement') {
    return (
      <div className={`w-full mr-auto ${className}`}>
        <div className="flex items-center">
          <button 
            onClick={() => setDialogOpen(true)}
            className="w-[30%] h-10 bg-[#fafafa] border border-[#084b49] text-[#545454] hover:bg-[#f0f0f0] flex justify-between items-center shadow-sm"
          >
            <span className="truncate ml-2">Web Smart Scan</span>
            <Globe className="mr-2 h-4 w-4 text-[#084b49]" />
          </button>
        </div>
        
        <WebScanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onWebsiteScan={handleWebsiteScan}
          savedUrl={savedUrl}
          savedInstructions={savedInstructions}
        />
      </div>
    );
  }
  
  // Default button style (original)
  return (
    <div className={`flex flex-col ${className}`}>
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
        savedUrl={savedUrl}
        savedInstructions={savedInstructions}
      />
    </div>
  );
};
