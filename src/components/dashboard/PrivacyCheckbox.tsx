
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PrivacyCheckboxProps {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => void;
  className?: string;
}

export const PrivacyCheckbox: React.FC<PrivacyCheckboxProps> = ({ isPrivate, onChange, className = "" }) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <button 
        onClick={() => onChange(!isPrivate)}
        className="h-10 w-32 bg-white border border-[#e5e7eb] text-[#545454] hover:bg-[#f8f9fa] flex justify-between items-center shadow-sm text-sm rounded-md px-4"
      >
        <span className="whitespace-nowrap">{isPrivate ? 'Privacy On' : 'Privacy'}</span>
        
        <div className="flex items-center gap-2">
          <Checkbox 
            id="privacy-checkbox" 
            checked={isPrivate} 
            onCheckedChange={() => onChange(!isPrivate)}
            className="data-[state=checked]:bg-transparent data-[state=checked]:border-[#e5e7eb]"
          />
          
          {isPrivate && (
            <span className="h-4 w-4 flex items-center justify-center">
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M20 6L9 17L4 12" 
                  stroke="#33fea6" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-[#545454]" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Aitema X will not use or share any of this data for any analytics purposes or else
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </button>
    </div>
  );
};
