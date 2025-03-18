
import { Switch } from "@/components/ui/switch";
import { Toggle } from "./types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Info } from "lucide-react";
import { useState } from "react";

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
    
    if (itemVariant === "primary") return "border-2 border-[#33fea6]/30 glow-effect";
    if (itemVariant === "secondary") return "border-2 border-[#084b49]/30 glow-effect";
    if (itemVariant === "aurora") return "border-2 border-[#64bf95]/30 glow-effect";
    
    return "border";
  };

  // Get tooltip icon hover color based on variant
  const getTooltipIconColor = () => {
    if (variant === "primary") return "#64bf95";
    if (variant === "secondary") return "#084b49";
    return "#64bf95"; // Default to primary color for aurora
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
                  {item.definition && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="text-card-foreground hover:text-[#64bf95] transition-colors ml-2 tooltip-trigger"
                            aria-label={`Learn more about ${item.label}`}
                          >
                            <HelpCircle 
                              size={18} 
                              className="tooltip-icon"
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-xs">
                          {item.definition}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            ) : (
              /* For primary and secondary variants, position toggle at the right side */
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-text flex flex-col items-start">
                  {item.label.split(" ").map((word, index) => (
                    <span key={index} className="leading-tight">{word}</span>
                  ))}
                </span>
                <div className="flex items-center">
                  <Switch 
                    id={item.id}
                    checked={isSelected}
                    onCheckedChange={() => onToggleChange(item.id)}
                    variant={variant}
                  />
                  
                  {/* Help icon for definition */}
                  {item.definition && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className={`text-card-foreground hover:text-[${getTooltipIconColor()}] transition-colors ml-2 tooltip-trigger`}
                            aria-label={`Learn more about ${item.label}`}
                          >
                            <HelpCircle 
                              size={18} 
                              className="tooltip-icon" 
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-xs">
                          {item.definition}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Only show tooltip outside for non-Aurora variants */}
      {tooltipText && !isAurora ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-card-foreground hover:text-[#64bf95] transition-colors">
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
