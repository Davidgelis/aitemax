
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
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1">
        <Textarea
          value={masterCommand}
          onChange={(e) => setMasterCommand(e.target.value)}
          placeholder="Master command (optional): Use this to adapt the prompt for specific contexts or needs"
          className="min-h-[80px] text-sm resize-none border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
      </div>
      <Button 
        onClick={handleRegenerate} 
        variant="outline" 
        className="h-10 whitespace-nowrap border-teal-800 bg-white hover:bg-teal-50 text-teal-800"
      >
        <RotateCw className="w-4 h-4 mr-2" />
        Regenerate
      </Button>
    </div>
  );
};
