
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
          className="flex items-center justify-between py-1.5 px-3 border rounded-lg bg-card flex-1"
        >
          <span className="text-sm text-card-foreground flex flex-col items-start">
            {item.label.split(" ").map((word, index) => (
              <span key={index} className="leading-tight">{word}</span>
            ))}
          </span>
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
