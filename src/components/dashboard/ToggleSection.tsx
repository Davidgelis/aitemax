
import { Switch } from "@/components/ui/switch";
import { Toggle } from "./types";

interface ToggleSectionProps {
  toggles: Toggle[];
  selectedToggle: string | null;
  onToggleChange: (id: string) => void;
  variant?: "primary" | "secondary";
  cols?: number;
}

export const ToggleSection = ({ 
  toggles, 
  selectedToggle, 
  onToggleChange, 
  variant = "primary", 
  cols = 4 
}: ToggleSectionProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-4`}>
      {toggles.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
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
