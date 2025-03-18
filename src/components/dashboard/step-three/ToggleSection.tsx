
import { RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface ToggleSectionProps {
  showJson: boolean;
  setShowJson: (show: boolean) => void;
  onRefreshJson?: () => void;
}

export const ToggleSection = ({
  showJson,
  setShowJson,
  onRefreshJson
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
      {showJson && onRefreshJson && (
        <Button
          onClick={onRefreshJson}
          size="xs"
          variant="slim"
          className="ml-2"
          title="Refresh JSON"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};
