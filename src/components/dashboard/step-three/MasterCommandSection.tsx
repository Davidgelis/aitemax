
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface MasterCommandSectionProps {
  masterCommand: string;
  setMasterCommand: (command: string) => void;
  handleRegenerate: () => void;
}

export const MasterCommandSection = ({
  masterCommand,
  setMasterCommand,
  handleRegenerate
}: MasterCommandSectionProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Textarea
          value={masterCommand}
          onChange={(e) => setMasterCommand(e.target.value)}
          placeholder="Master command (optional): Use this to adapt the prompt for specific contexts or needs"
          className="min-h-[80px] text-sm resize-none"
        />
      </div>
      <Button 
        onClick={handleRegenerate} 
        variant="outline" 
        className="h-10 whitespace-nowrap"
      >
        <RotateCw className="w-4 h-4 mr-2" />
        Regenerate
      </Button>
    </div>
  );
};
