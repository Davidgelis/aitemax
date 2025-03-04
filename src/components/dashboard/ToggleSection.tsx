
import { Switch } from "@/components/ui/switch";
import { Toggle } from "./types";

interface ToggleSectionProps {
  toggles: Toggle[];
  selectedToggle: string | null;
  onToggleChange: (id: string) => void;
  variant?: "primary" | "secondary";
}

export const ToggleSection = ({ 
  toggles, 
  selectedToggle, 
  onToggleChange, 
  variant = "primary"
}: ToggleSectionProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {toggles.map((item) => (
        <div 
          key={item.id} 
          className="flex-1 min-w-[200px] flex items-center justify-between py-1.5 px-3 border rounded-lg bg-card"
        >
          <span className="text-sm text-card-foreground">{item.label}</span>
          <Switch 
            id={item.id}
            checked={selectedToggle === item.id}
            onCheckedChange={() => onToggleChange(item.id)}
            variant={variant}
          />
        </div>
      ))}
    </div>
  );
};
