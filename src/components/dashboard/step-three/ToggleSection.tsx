
import { RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

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
  // Handler to ensure toggle follows the same pattern as refresh
  const handleToggle = (checked: boolean) => {
    // First update the state
    setShowJson(checked);
    
    // If toggling to JSON view and refresh function exists, call it 
    // with a small delay to allow state update to complete first
    if (checked && refreshJson) {
      // Use a very small timeout to ensure state is updated first
      setTimeout(() => {
        refreshJson();
      }, 50);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs">JSON Toggle view</span>
      <Switch
        checked={showJson}
        onCheckedChange={handleToggle}
        className="scale-75"
        variant="primary"
      />
      
      {showJson && refreshJson && (
        <Button 
          onClick={refreshJson}
          variant="ghost" 
          size="xs"
          className="ml-1 p-1 h-6 w-6"
          title="Refresh JSON"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 text-accent ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh JSON</span>
        </Button>
      )}
    </div>
  );
};
