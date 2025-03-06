
import { RotateCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

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
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-1">
        <Input
          value={masterCommand}
          onChange={(e) => setMasterCommand(e.target.value)}
          placeholder="Master command, use it to adapt the prompt to any other similar needs"
          className="w-full h-8 text-sm"
        />
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="aurora-button inline-flex items-center gap-2">
            <RotateCw className="w-4 h-4" />
            <span>Adapt</span>
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will regenerate your prompt. Any manual changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
