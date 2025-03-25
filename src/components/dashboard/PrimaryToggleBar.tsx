
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { primaryToggles } from './constants';

interface PrimaryToggleBarProps {
  selectedPrimary: string | null;
  handlePrimaryToggle: (id: string) => void;
}

export const PrimaryToggleBar = ({ selectedPrimary, handlePrimaryToggle }: PrimaryToggleBarProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Purpose of this prompt</p>
      <div className="flex flex-wrap gap-2">
        {primaryToggles.map((toggle) => {
          const ToggleIcon = toggle.icon;
          
          return (
            <Button
              key={toggle.id}
              variant="slim"
              size="xs"
              className={`group ${
                selectedPrimary === toggle.id
                  ? 'bg-[#33fea6]/10 text-[#33fea6] border border-[#33fea6]/50'
                  : 'text-[#64bf95] hover:text-[#33fea6] animate-aurora-border'
              }`}
              onClick={() => handlePrimaryToggle(toggle.id)}
            >
              {ToggleIcon && (
                <ToggleIcon className={`w-3 h-3 mr-1 ${
                  selectedPrimary === toggle.id 
                    ? 'text-[#33fea6]' 
                    : 'text-[#64bf95] group-hover:text-[#33fea6]'
                } transition-colors`} />
              )}
              <span>{toggle.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
