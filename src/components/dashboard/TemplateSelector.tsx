
import { useState } from "react";
import { TemplateType } from "../x-templates/XTemplateCard";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react"; // Changed from InfoCircle to Info

interface TemplateSelectorProps {
  templates: TemplateType[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
}

export const TemplateSelector = ({
  templates,
  selectedTemplateId,
  onSelectTemplate
}: TemplateSelectorProps) => {
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-medium">Template Selection</h3>
        <Info className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Select a template to structure your prompt. Each template provides different emphasis and character limits.
      </p>
      
      <Select value={selectedTemplateId} onValueChange={onSelectTemplate}>
        <SelectTrigger className="w-full mb-4">
          <SelectValue placeholder="Select a template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map(template => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
              {template.isDefault && " (Default)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedTemplate && (
        <Card className="p-4 bg-card border border-border">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium">{selectedTemplate.name}</h4>
              {selectedTemplate.characterLimit && (
                <Badge variant="outline" className="bg-primary/10 text-xs">
                  {selectedTemplate.characterLimit.toLocaleString()} char limit
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{selectedTemplate.createdAt}</p>
          </div>
          
          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Role:</p>
            <p className="text-sm line-clamp-2">{selectedTemplate.role}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1">Pillars:</p>
            <div className="flex flex-wrap gap-2">
              {selectedTemplate.pillars.map((pillar) => (
                <Badge key={pillar.id} variant="outline" className="bg-primary/10">
                  {pillar.title}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
