
import { Textarea } from "@/components/ui/textarea";

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
  // This component will be empty as we're removing both the input and button
  return null;
};
