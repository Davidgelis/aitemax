
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { PillarType } from "@/components/x-templates/XTemplateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { PROTECTED_TEMPLATE_IDS } from "@/components/dashboard/constants";

interface TemplateSelectorProps {
  className?: string;
}

export const TemplateSelector = ({ className }: TemplateSelectorProps) => {
  const { currentTemplate, selectTemplate, templates } = useTemplateManagement();
  const navigate = useNavigate();

  // Separate templates into default/system and user-created
  const defaultTemplates = templates?.filter(template => 
    PROTECTED_TEMPLATE_IDS.includes(template.id) || template.isDefault
  ) || [];
  
  const userTemplates = templates?.filter(template => 
    !PROTECTED_TEMPLATE_IDS.includes(template.id) && !template.isDefault
  ) || [];

  const isCurrentTemplateDefault = currentTemplate && 
    (PROTECTED_TEMPLATE_IDS.includes(currentTemplate.id) || currentTemplate.isDefault);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        {/* System Templates Dropdown */}
        <Select
          value={isCurrentTemplateDefault ? currentTemplate?.id : undefined}
          onValueChange={(value) => selectTemplate(value)}
        >
          <SelectTrigger 
            className="w-[220px] bg-[#f2fbf7] border-[#64bf95] hover:border-[#33fea6] transition-colors"
          >
            <SelectValue placeholder="System Templates" />
          </SelectTrigger>
          <SelectContent>
            {defaultTemplates.map((template) => (
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

        {/* User Templates Dropdown */}
        <Select
          value={!isCurrentTemplateDefault ? currentTemplate?.id : undefined}
          onValueChange={(value) => selectTemplate(value)}
        >
          <SelectTrigger 
            className="w-[220px] bg-[#f7f7f7] border-[#acacac] hover:border-[#64bf95] transition-colors"
          >
            <SelectValue placeholder="Your Templates" />
          </SelectTrigger>
          <SelectContent>
            {userTemplates.length > 0 ? (
              userTemplates.map((template) => (
                <SelectItem 
                  key={template.id} 
                  value={template.id}
                  className="hover:bg-white hover:text-[#64bf95] transition-colors"
                >
                  {template.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No custom templates
              </div>
            )}
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
