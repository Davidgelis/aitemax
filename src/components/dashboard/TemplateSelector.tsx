
import { useState } from 'react';
import { PromptTemplate } from './types';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

interface TemplateSelectorProps {
  templates: PromptTemplate[];
  selectedTemplate: PromptTemplate | null;
  isLoading: boolean;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateSelector = ({ 
  templates, 
  selectedTemplate, 
  isLoading, 
  onSelectTemplate 
}: TemplateSelectorProps) => {
  const handleTemplateChange = (templateId: string) => {
    onSelectTemplate(templateId);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="template-selector" className="text-sm font-medium">
          <div className="flex items-center gap-1">
            Prompt Template
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[280px] p-3">
                  <p className="text-xs text-muted-foreground">
                    Select a template to structure your prompt. Templates define sections and formatting rules
                    used to enhance your prompt.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Label>
      </div>
      
      <Select
        disabled={isLoading || templates.length === 0}
        value={selectedTemplate?.id || ''}
        onValueChange={handleTemplateChange}
      >
        <SelectTrigger id="template-selector" className="w-full">
          <SelectValue placeholder="Select a template" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Default Templates</SelectLabel>
            {templates
              .filter(t => t.isDefault)
              .map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.title}
                </SelectItem>
              ))}
            
            {templates.some(t => !t.isDefault) && (
              <>
                <SelectLabel className="mt-2">Your Templates</SelectLabel>
                {templates
                  .filter(t => !t.isDefault)
                  .map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
              </>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>

      {selectedTemplate && (
        <div className="text-xs text-muted-foreground italic">
          {selectedTemplate.description || 
            `Template with ${selectedTemplate.pillars.length} sections: ${selectedTemplate.pillars.map(p => p.name).join(', ')}`}
        </div>
      )}
    </div>
  );
};
