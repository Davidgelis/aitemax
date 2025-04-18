
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { PillarType } from "@/components/x-templates/XTemplateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface TemplateSelectorProps {
  className?: string;
}

export const TemplateSelector = ({ className }: TemplateSelectorProps) => {
  const { currentTemplate, selectTemplate, templates } = useTemplateManagement();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate("/x-panel")}
                className="hover:text-[#33fea6] hover:border-[#33fea6]"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manage templates</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
