
import { Switch } from "@/components/ui/switch";
import { Toggle } from "./types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface ToggleSectionProps {
  toggles: Toggle[];
  selectedToggle: string | null;
  onToggleChange: (id: string) => void;
  variant?: "primary" | "secondary" | "aurora";
  tooltipText?: string;
  className?: string;
}

export const ToggleSection = ({ 
  toggles, 
  selectedToggle, 
  onToggleChange, 
  variant = "primary",
  tooltipText,
  className = ""
}: ToggleSectionProps) => {
  // Function to determine the border class based on selected state and variant
  const getBorderClass = (isSelected: boolean, itemVariant: string) => {
    if (!isSelected) return "border";
    
    if (itemVariant === "primary") return "border-2 border-primary/30 glow-effect";
    if (itemVariant === "secondary") return "border-2 border-[#64bf95]/30 glow-effect";
    if (itemVariant === "aurora") return ""; // Remove border for aurora variant
    
    return "border";
  };

  // Different styling for the aurora variant
  const isAurora = variant === "aurora";
  const containerClass = isAurora 
    ? "flex items-center gap-2 " + className
    : "flex flex-wrap gap-2 " + className;

  // For aurora variant, we only show the first toggle
  const displayToggles = isAurora && toggles.length > 0 ? [toggles[0]] : toggles;

  return (
    <div className={containerClass}>
      {displayToggles.map((item) => {
        const isSelected = selectedToggle === item.id;
        
        return (
          <div 
            key={item.id} 
            className={`flex items-center justify-between py-1.5 px-3 ${getBorderClass(isSelected, variant)} rounded-lg ${isAurora ? 'bg-aurora animate-aurora w-[200%]' : 'bg-card'} flex-1 transition-all duration-300`}
          >
            <span className={`text-sm text-[#041524] ${isAurora ? 'flex-nowrap whitespace-nowrap pr-6' : 'flex flex-col items-start'}`}>
              {isAurora 
                ? item.label 
                : item.label.split(" ").map((word, index) => (
                    <span key={index} className="leading-tight">{word}</span>
                  ))
              }
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
      
      {tooltipText && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-card-foreground hover:text-primary transition-colors">
                <HelpCircle size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
