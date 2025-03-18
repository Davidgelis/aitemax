
import { RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface ToggleSectionProps {
  showJson: boolean;
  setShowJson: (show: boolean) => void;
  refreshJson?: () => void;
  isRefreshing?: boolean;
}

export const ToggleSection = ({
  showJson,
  setShowJson,
  refreshJson,
  isRefreshing = false
}: ToggleSectionProps) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  
  // Simple direct toggle handler
  const handleToggle = (checked: boolean) => {
    setShowJson(checked);
  };
  
  // Handle refresh with debounce to prevent multiple clicks
  const handleRefresh = () => {
    if (!isRefreshing && !isButtonDisabled && refreshJson) {
      setIsButtonDisabled(true);
      refreshJson();
      
      // Re-enable the button after a short delay
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 2000);
    }
  };
  
  // Reset disabled state when refreshing completes
  useEffect(() => {
    if (!isRefreshing) {
      setIsButtonDisabled(false);
    }
  }, [isRefreshing]);

  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs">JSON Toggle view</span>
      <Switch
        checked={showJson}
        onCheckedChange={handleToggle}
        className="scale-75"
      />
      
      {showJson && refreshJson && (
        <Button 
          onClick={handleRefresh}
          variant="ghost" 
          size="sm"
          className="ml-1 p-1 h-6 w-6"
          title="Refresh JSON with current prompt content"
          disabled={isRefreshing || isButtonDisabled}
        >
          <RefreshCw className={`h-3.5 w-3.5 text-accent ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh JSON</span>
        </Button>
      )}
    </div>
  );
};
