
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { PillarType } from "@/components/x-templates/XTemplateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

interface TemplateSelectorProps {
  className?: string;
}

export const TemplateSelector = ({ className }: TemplateSelectorProps) => {
  const { currentTemplate, selectTemplate, templates } = useTemplateManagement();
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
            {templates?.map((template) => (
              <SelectItem 
                key={template.id} 
                value={template.id}
                className="hover:bg-white hover:text-[#33fea6] transition-colors"
              >
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/x-panel")}
          className="ml-2"
        >
          <FileText className="w-4 h-4 mr-2" />
          Manage Templates
        </Button>
      </div>

      {currentTemplate && (
        <div className="flex items-center gap-2 flex-wrap">
          {currentTemplate.pillars.map((pillar: PillarType) => (
            <Badge 
              key={pillar.id}
              variant="outline" 
              className="bg-[#64bf95]/10 text-xs"
            >
              {pillar.title}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
