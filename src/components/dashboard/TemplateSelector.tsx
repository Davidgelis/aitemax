
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { PillarType } from "@/components/x-templates/XTemplateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileTemplate } from "lucide-react";

interface TemplateSelectorProps {
  className?: string;
}

export const TemplateSelector = ({ className }: TemplateSelectorProps) => {
  const { currentTemplate, selectTemplate } = useTemplateManagement();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select
          value={currentTemplate?.id}
          onValueChange={(value) => selectTemplate(value)}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {currentTemplate && (
              <SelectItem value={currentTemplate.id}>
                {currentTemplate.name}
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/x-panel")}
          className="ml-2"
        >
          <FileTemplate className="w-4 h-4 mr-2" />
          Manage Templates
        </Button>
      </div>

      {currentTemplate && (
        <div className="grid grid-cols-2 gap-4">
          {currentTemplate.pillars.map((pillar: PillarType) => (
            <div 
              key={pillar.id}
              className="border rounded-lg p-4 bg-card"
            >
              <h3 className="font-medium text-sm mb-2">{pillar.title}</h3>
              <Badge variant="outline" className="bg-[#64bf95]/10">
                {pillar.title}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
