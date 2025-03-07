
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
    if (itemVariant === "aurora") return "border-2 border-primary/30 glow-effect"; // Updated to match primary
    
    return "border";
  };

  const containerClass = "flex flex-wrap gap-2 " + className;
  const isAurora = variant === "aurora";

  return (
    <div className={containerClass}>
      {toggles.map((item) => {
        const isSelected = selectedToggle === item.id;
        
        return (
          <div 
            key={item.id} 
            className={`flex items-center py-1.5 px-3 ${getBorderClass(isSelected, variant)} rounded-lg bg-white flex-1 transition-all duration-300`}
          >
            {/* For Aurora variant, keep text in a single line */}
            {isAurora ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-text whitespace-nowrap mr-4">{item.label}</span>
                <div className="flex items-center ml-auto">
                  <Switch 
                    id={item.id}
                    checked={isSelected}
                    onCheckedChange={() => onToggleChange(item.id)}
                    variant={variant}
                  />
                  
                  {/* Help icon positioned at far right */}
                  {tooltipText && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-card-foreground hover:text-primary transition-colors ml-2">
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
              </div>
            ) : (
              <>
                <span className="text-sm text-text flex flex-col items-start">
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
              </>
            )}
          </div>
        );
      })}
      
      {/* Only show tooltip outside for non-Aurora variants */}
      {tooltipText && !isAurora ? (
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
      ) : null}
    </div>
  );
};
