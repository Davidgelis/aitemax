
import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { SmartContextDialog } from './SmartContextDialog';

interface SmartContextProps {
  onSmartContext: (context: string, usageInstructions: string) => void;
  variant?: 'default' | 'modelReplacement';
  className?: string;
}

export const SmartContext = ({ 
  onSmartContext, 
  variant = 'default', 
  className = '' 
}: SmartContextProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savedContext, setSavedContext] = useState('');
  const [savedUsageInstructions, setSavedUsageInstructions] = useState('');
  const [hasContext, setHasContext] = useState(false);
  
  const handleSmartContext = (context: string, usageInstructions: string) => {
    // Save the values for persistence
    setSavedContext(context);
    setSavedUsageInstructions(usageInstructions);
    setHasContext(true);
    
    // Call the parent handler
    console.log("SmartContext: Sending context data to parent");
    onSmartContext(context, usageInstructions);
  };

  const handleDeleteContext = () => {
    setSavedContext('');
    setSavedUsageInstructions('');
    setHasContext(false);
    
    // Call the parent handler with empty values to clear the context
    console.log("SmartContext: Deleting context");
    onSmartContext('', '');
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
            title="Add specific context to enhance your prompt"
          >
            <span className="truncate ml-1">Smart Context</span>
            <MessageSquareText className={`mr-1 h-4 w-4 ${hasContext ? 'text-[#33fea6]' : 'text-[#084b49]'}`} />
          </button>
        </div>
        
        <SmartContextDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSmartContext={handleSmartContext}
          onDeleteContext={handleDeleteContext}
          savedContext={savedContext}
          savedUsageInstructions={savedUsageInstructions}
          hasContext={hasContext}
        />
      </div>
    );
  }
  
  // Default button style (using the new Button component)
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="mb-2 flex items-center">
        <button
          onClick={() => setDialogOpen(true)}
          className={`group animate-aurora-border ${hasContext ? 'shadow-[0_0_5px_0_#33fea6]' : ''}`}
          title="Add specific context to enhance your prompt"
        >
          <MessageSquareText className={`w-3 h-3 ${hasContext ? 'text-[#33fea6]' : 'text-[#64bf95] group-hover:text-[#33fea6]'} transition-colors`} />
          <span>Smart Context</span>
        </button>
      </div>
      
      <SmartContextDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSmartContext={handleSmartContext}
        onDeleteContext={handleDeleteContext}
        savedContext={savedContext}
        savedUsageInstructions={savedUsageInstructions}
        hasContext={hasContext}
      />
    </div>
  );
};
