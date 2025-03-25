
import { Input } from "@/components/ui/input";

export interface MasterCommandSectionProps {
  masterCommand: string;
  setMasterCommand: React.Dispatch<React.SetStateAction<string>>;
  handleRegenerate?: () => void;
}

export const MasterCommandSection = ({
  masterCommand,
  setMasterCommand,
  handleRegenerate
}: MasterCommandSectionProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-medium">Master Command</h3>
      </div>
      <Input
        value={masterCommand}
        onChange={(e) => setMasterCommand(e.target.value)}
        placeholder="Add a master command or objective"
        className="border-[#E5E7EB] focus-visible:ring-[#33fea6]"
      />
    </div>
  );
};
