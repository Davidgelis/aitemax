
import { Switch } from "@/components/ui/switch";

interface ToggleSectionProps {
  showJson: boolean;
  setShowJson: (show: boolean) => void;
}

export const ToggleSection = ({
  showJson,
  setShowJson
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
    </div>
  );
};
