
import { Button } from '@/components/ui/button';
import { secondaryToggles } from './constants';

interface SecondaryToggleBarProps {
  selectedSecondary: string | null;
  handleSecondaryToggle: (id: string) => void;
}

export const SecondaryToggleBar = ({ selectedSecondary, handleSecondaryToggle }: SecondaryToggleBarProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Tone of the response</p>
      <div className="flex flex-wrap gap-2">
        {secondaryToggles.map((toggle) => (
          <Button
            key={toggle.id}
            variant="slim"
            size="xs"
            className={`group ${
              selectedSecondary === toggle.id
                ? 'bg-[#33fea6]/10 text-[#33fea6] border border-[#33fea6]/50'
                : 'text-[#64bf95] hover:text-[#33fea6] animate-aurora-border'
            }`}
            onClick={() => handleSecondaryToggle(toggle.id)}
          >
            <toggle.icon className={`w-3 h-3 mr-1 ${
              selectedSecondary === toggle.id 
                ? 'text-[#33fea6]' 
                : 'text-[#64bf95] group-hover:text-[#33fea6]'
            } transition-colors`} />
            <span>{toggle.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
