
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
  const [hasContext, setHasContext] = useState(false);
  
  const handleWebsiteScan = (url: string, instructions: string) => {
    // Save the values for persistence
    setSavedUrl(url);
    setSavedInstructions(instructions);
    setHasContext(true);
    
    // Add additional logging to debug data flow
    console.log("WebScanner: Preparing to send website data to parent");
    console.log("URL:", url);
    console.log("Instructions:", instructions || "No specific instructions provided");
    
    // Call the parent handler without modifying any text area
    console.log("WebScanner: Sending website data to parent");
    onWebsiteScan(url, instructions);
  };

  const handleDeleteScan = () => {
    setSavedUrl('');
    setSavedInstructions('');
    setHasContext(false);
    
    // Call the parent handler with empty values to clear the context
    console.log("WebScanner: Deleting website context");
    onWebsiteScan('', '');
  };

  // Model replacement style button
  if (variant === 'modelReplacement') {
    return (
      <div className={`w-full mr-auto ${className}`}>
        <div className="flex items-center">
          <button 
            onClick={() => setDialogOpen(true)}
            className={`w-[220px] h-10 bg-white border border-[#e5e7eb] text-[#545454] hover:bg-[#f8f9fa] flex justify-between items-center text-sm rounded-md px-4 transition-all duration-300 ${
              hasContext 
                ? 'shadow-[0_0_5px_0_#33fea6]' 
                : 'shadow-sm'
            }`}
            title="Extract specific information from a website to enhance your prompt"
          >
            <span className="truncate ml-1">Web Smart Scan</span>
            <Globe className={`mr-1 h-4 w-4 ${hasContext ? 'text-[#33fea6]' : 'text-[#084b49]'}`} />
          </button>
        </div>
        
        <WebScanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onWebsiteScan={handleWebsiteScan}
          onDeleteScan={handleDeleteScan}
          savedUrl={savedUrl}
          savedInstructions={savedInstructions}
          hasContext={hasContext}
        />
      </div>
    );
  }
  
  // Default button style (using the new Button component)
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="mb-2 flex items-center">
        <Button
          onClick={() => setDialogOpen(true)}
          variant="slim"
          size="xs"
          className={`group animate-aurora-border ${
            hasContext 
              ? 'shadow-[0_0_5px_0_#33fea6]' 
              : ''
          }`}
          title="Extract specific information from a website to enhance your prompt"
        >
          <Globe className={`w-3 h-3 ${hasContext ? 'text-[#33fea6]' : 'text-[#64bf95] group-hover:text-[#33fea6]'} transition-colors`} />
          <span>Web Scan</span>
        </Button>
      </div>
      
      <WebScanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onWebsiteScan={handleWebsiteScan}
        onDeleteScan={handleDeleteScan}
        savedUrl={savedUrl}
        savedInstructions={savedInstructions}
        hasContext={hasContext}
      />
    </div>
  );
};
