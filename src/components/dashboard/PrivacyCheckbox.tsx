
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LockIcon, UnlockIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PrivacyCheckboxProps {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => void;
  className?: string;
}

export const PrivacyCheckbox = ({ isPrivate, onChange, className = "" }: PrivacyCheckboxProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(!isPrivate)}>
              <Checkbox 
                id="privacy-checkbox" 
                checked={isPrivate} 
                onCheckedChange={() => onChange(!isPrivate)}
                className="data-[state=checked]:bg-[#084b49] data-[state=checked]:border-[#084b49]"
              />
              <Label 
                htmlFor="privacy-checkbox" 
                className="cursor-pointer text-sm font-medium text-muted-foreground flex items-center"
              >
                {isPrivate ? (
                  <>
                    <LockIcon className="w-3.5 h-3.5 mr-1 text-[#084b49]" />
                    Private
                  </>
                ) : (
                  <>
                    <UnlockIcon className="w-3.5 h-3.5 mr-1" />
                    Public
                  </>
                )}
              </Label>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isPrivate 
              ? "Your prompt won't be used for data analysis or training" 
              : "Your prompt may be used for data analysis and training"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
