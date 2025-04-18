
import { useTemplateManagement } from "@/hooks/useTemplateManagement";

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
  const { currentTemplate } = useTemplateManagement();
  
  // This component will display template info instead of master command
  return (
    <div className="mb-4">
      {currentTemplate && (
        <div className="text-sm text-muted-foreground">
          Template: {currentTemplate.name}
        </div>
      )}
    </div>
  );
};
