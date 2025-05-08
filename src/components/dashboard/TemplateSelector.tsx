
import { PillarType } from "@/components/x-templates/XTemplateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { TemplateMegaMenu } from "./TemplateMegaMenu";
import { TemplatePillarDebugger } from "./TemplatePillarDebugger";

interface TemplateSelectorProps {
  className?: string;
  showDebug?: boolean;
}

export const TemplateSelector = ({ className, showDebug = false }: TemplateSelectorProps) => {
  const { currentTemplate } = useTemplateManagement();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Single consolidated mega menu for all templates */}
        <TemplateMegaMenu />

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
        <div className="flex items-center gap-2 flex-wrap bg-[#f8fefa] p-3 border border-[#64bf95]/20 rounded-md">
          {currentTemplate.pillars.map((pillar: PillarType) => (
            <Badge 
              key={pillar.id}
              variant="outline" 
              className="bg-[#64bf95]/10 text-xs hover:bg-[#64bf95]/20"
            >
              {pillar.title}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Show debug information in development mode if enabled */}
      {showDebug && import.meta.env.DEV && <TemplatePillarDebugger />}
    </div>
  );
};
