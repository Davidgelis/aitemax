
import { RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface ToggleSectionProps {
  showJson: boolean;
  setShowJson: (show: boolean) => void;
  refreshJson?: () => void;
}

export const ToggleSection = ({
  showJson,
  setShowJson,
  refreshJson
}: ToggleSectionProps) => {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs">JSON Toggle view</span>
      <Switch
        checked={showJson}
        onCheckedChange={setShowJson}
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
        >
          <RefreshCw className="h-3.5 w-3.5 text-accent" />
        </Button>
      )}
    </div>
  );
};
