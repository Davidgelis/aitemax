
import { Switch } from "@/components/ui/switch";
import { Toggle } from "./types";
import { Separator } from "@/components/ui/separator";

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
  // Get the appropriate grid column class based on the cols prop
  const getGridClass = () => {
    switch(cols) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 md:grid-cols-2";
      case 3: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
      default: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
    }
  };

  return (
    <div className={`grid ${getGridClass()} gap-2`}>
      {toggles.map((item) => (
        <div key={item.id} className="flex items-center justify-between py-1.5 px-2 border rounded-lg bg-card">
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
