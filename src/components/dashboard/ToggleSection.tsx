
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
  // Function to determine the border class based on selected state and variant
  const getBorderClass = (isSelected: boolean, itemVariant: string) => {
    if (!isSelected) return "border";
    
    if (itemVariant === "primary") return "border-2 border-primary/30 glow-effect";
    if (itemVariant === "secondary") return "border-2 border-[#64bf95]/30 glow-effect";
    
    return "border";
  };

  return (
    <div className="flex flex-wrap gap-2">
      {toggles.map((item) => {
        const isSelected = selectedToggle === item.id;
        
        return (
          <div 
            key={item.id} 
            className={`flex items-center justify-between py-1.5 px-3 ${getBorderClass(isSelected, variant)} rounded-lg bg-card flex-1 transition-all duration-300`}
          >
            <span className="text-sm text-card-foreground flex flex-col items-start">
              {item.label.split(" ").map((word, index) => (
                <span key={index} className="leading-tight">{word}</span>
              ))}
            </span>
            <Switch 
              id={item.id}
              checked={isSelected}
              onCheckedChange={() => onToggleChange(item.id)}
              variant={variant}
            />
          </div>
        );
      })}
    </div>
  );
};
