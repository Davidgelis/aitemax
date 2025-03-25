
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
  showJson?: boolean;
  setShowJson?: (show: boolean) => void;
  refreshJson?: () => void;
  isRefreshing?: boolean;
  selectedPrimary?: string | null;
  selectedSecondary?: string | null;
  handlePrimaryToggle?: (id: string) => void;
  handleSecondaryToggle?: (id: string) => void;
}

export const ToggleSection = ({ 
  toggles, 
  selectedToggle, 
  onToggleChange, 
  variant = "primary",
  tooltipText,
  className = "",
  showJson,
  setShowJson,
  refreshJson,
  isRefreshing,
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle
}: ToggleSectionProps) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  
  // Simple direct toggle handler for JSON view
  const handleJsonToggle = (checked: boolean) => {
    if (setShowJson) {
      setShowJson(checked);
    }
  };
  
  // Handle refresh with debounce to prevent multiple clicks
  const handleRefresh = () => {
    if (!isRefreshing && !isButtonDisabled && refreshJson) {
      setIsButtonDisabled(true);
      refreshJson();
      
      // Re-enable the button after a short delay
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 2000);
    }
  };

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

  // If this is being used for the JSON toggle view
  if (showJson !== undefined && setShowJson) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs">JSON Toggle view</span>
        <Switch
          checked={showJson}
          onCheckedChange={handleJsonToggle}
          className="scale-75"
          variant="primary"
        />
        
        {showJson && refreshJson && (
          <button 
            onClick={handleRefresh}
            className="ml-1 p-1 h-6 w-6 text-accent hover:text-accent-foreground"
            title="Refresh JSON with current prompt content"
            disabled={isRefreshing || isButtonDisabled}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${isRefreshing ? 'animate-spin' : ''}`}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            <span className="sr-only">Refresh JSON</span>
          </button>
        )}
      </div>
    );
  }

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
            data-variant={variant}
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
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <button 
                            className="text-card-foreground tooltip-trigger ml-2"
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
