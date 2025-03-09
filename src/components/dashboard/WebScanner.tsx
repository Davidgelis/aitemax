
import { useState } from 'react';
import { Globe } from 'lucide-react';
import { WebScanDialog } from './WebScanDialog';
import { Button } from "@/components/ui/button";

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
  };

  // Model replacement style button
  if (variant === 'modelReplacement') {
    return (
      <div className={`w-full mr-auto ${className}`}>
        <div className="flex items-center">
          <button 
            onClick={() => setDialogOpen(true)}
            className="w-[30%] h-8 bg-[#fafafa] border border-[#084b49] text-[#545454] hover:bg-[#f0f0f0] flex justify-between items-center shadow-sm text-xs"
          >
            <span className="truncate ml-2">Web Smart Scan</span>
            <Globe className="mr-2 h-3 w-3 text-[#084b49]" />
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
  
  // Default button style (using the new Button component)
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="mb-2">
        <Button
          onClick={() => setDialogOpen(true)}
          variant="slim"
          size="xs"
          className="group animate-aurora-border"
          title="Scan website"
        >
          <Globe className="w-3 h-3 text-[#64bf95] group-hover:text-[#33fea6] transition-colors" />
          <span>Web Scan</span>
        </Button>
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
