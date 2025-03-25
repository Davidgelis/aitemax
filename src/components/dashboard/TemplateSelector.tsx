
import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PromptTemplate, PromptTemplatePillar } from "@/hooks/usePromptTemplates";
import { Copy, Plus, Settings, Trash2 } from "lucide-react";

interface TemplateSelectorProps {
  templates: PromptTemplate[];
  selectedTemplate: PromptTemplate | null;
  onTemplateSelect: (template: PromptTemplate) => void;
  onCreateTemplate?: (template: Partial<PromptTemplate>) => Promise<PromptTemplate | null>;
  onUpdateTemplate?: (id: string, template: Partial<PromptTemplate>) => Promise<PromptTemplate | null>;
  onDeleteTemplate?: (id: string) => Promise<boolean>;
  isLoading?: boolean;
  isLoggedIn?: boolean;
}

export function TemplateSelector({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  isLoading = false,
  isLoggedIn = false
}: TemplateSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateSystemPrefix, setNewTemplateSystemPrefix] = useState("");
  const [newTemplateMaxChars, setNewTemplateMaxChars] = useState(4000);
  const [newTemplateTemperature, setNewTemplateTemperature] = useState(7); // 0.7 * 10 for slider
  const [newTemplatePillars, setNewTemplatePillars] = useState<PromptTemplatePillar[]>([
    { name: "", description: "" }
  ]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onTemplateSelect(template);
    }
  };

  // Clone a template for editing
  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setNewTemplateName(template.title);
    setNewTemplateDescription(template.description || "");
    setNewTemplateSystemPrefix(template.system_prefix || "");
    setNewTemplateMaxChars(template.max_chars || 4000);
    setNewTemplateTemperature(Math.round((template.temperature || 0.7) * 10));
    setNewTemplatePillars(template.pillars || []);
    setIsEditDialogOpen(true);
  };

  // Duplicate a template
  const handleDuplicateTemplate = async (template: PromptTemplate) => {
    if (!onCreateTemplate) return;
    
    const newTemplate = {
      title: `${template.title} (Copy)`,
      description: template.description,
      system_prefix: template.system_prefix,
      pillars: template.pillars,
      max_chars: template.max_chars,
      temperature: template.temperature,
      is_default: false
    };
    
    const created = await onCreateTemplate(newTemplate);
    if (created) {
      onTemplateSelect(created);
    }
  };

  // Create a new template
  const handleCreateTemplate = async () => {
    if (!onCreateTemplate) return;
    
    const newTemplate = {
      title: newTemplateName,
      description: newTemplateDescription,
      system_prefix: newTemplateSystemPrefix,
      pillars: newTemplatePillars.filter(p => p.name.trim() !== ""),
      max_chars: newTemplateMaxChars,
      temperature: newTemplateTemperature / 10,
      is_default: false
    };
    
    const created = await onCreateTemplate(newTemplate);
    if (created) {
      onTemplateSelect(created);
      setIsCreateDialogOpen(false);
      resetForm();
    }
  };

  // Update an existing template
  const handleUpdateTemplate = async () => {
    if (!onUpdateTemplate || !editingTemplate) return;
    
    const updates = {
      title: newTemplateName,
      description: newTemplateDescription,
      system_prefix: newTemplateSystemPrefix,
      pillars: newTemplatePillars.filter(p => p.name.trim() !== ""),
      max_chars: newTemplateMaxChars,
      temperature: newTemplateTemperature / 10
    };
    
    const updated = await onUpdateTemplate(editingTemplate.id, updates);
    if (updated) {
      onTemplateSelect(updated);
      setIsEditDialogOpen(false);
    }
  };

  // Delete a template
  const handleDeleteTemplate = async () => {
    if (!onDeleteTemplate || !editingTemplate) return;
    
    const success = await onDeleteTemplate(editingTemplate.id);
    if (success) {
      setIsEditDialogOpen(false);
      // Select the first available template
      if (templates.length > 0) {
        onTemplateSelect(templates[0]);
      }
    }
  };

  // Reset form for new template
  const resetForm = () => {
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewTemplateSystemPrefix("");
    setNewTemplateMaxChars(4000);
    setNewTemplateTemperature(7);
    setNewTemplatePillars([{ name: "", description: "" }]);
  };

  // Handle adding a new pillar
  const handleAddPillar = () => {
    setNewTemplatePillars([...newTemplatePillars, { name: "", description: "" }]);
  };

  // Handle pillar field changes
  const handlePillarChange = (index: number, field: keyof PromptTemplatePillar, value: string) => {
    const updatedPillars = [...newTemplatePillars];
    updatedPillars[index][field] = value;
    setNewTemplatePillars(updatedPillars);
  };

  // Handle removing a pillar
  const handleRemovePillar = (index: number) => {
    const updatedPillars = [...newTemplatePillars];
    updatedPillars.splice(index, 1);
    setNewTemplatePillars(updatedPillars);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="template-select" className="text-sm font-medium">
          Prompt Template
        </Label>
        
        {isLoggedIn && onCreateTemplate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Create a custom prompt template to use for enhancing your prompts.
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="flex-1 px-1">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      placeholder="e.g., My Custom Framework"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      placeholder="Describe what this template is designed for..."
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      rows={2}
                      maxLength={500}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="system-prefix">System Prefix</Label>
                    <Textarea
                      id="system-prefix"
                      placeholder="You are an expert prompt engineer that transforms input prompts..."
                      value={newTemplateSystemPrefix}
                      onChange={(e) => setNewTemplateSystemPrefix(e.target.value)}
                      rows={3}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      This is the initial instruction given to the AI. It sets the tone and approach.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Framework Pillars</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddPillar}
                        className="h-7 px-2"
                      >
                        Add Pillar
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {newTemplatePillars.map((pillar, index) => (
                        <div key={index} className="space-y-2 border p-3 rounded-md">
                          <div className="flex justify-between items-center">
                            <Label htmlFor={`pillar-name-${index}`}>Pillar Name</Label>
                            {newTemplatePillars.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePillar(index)}
                                className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <Input
                            id={`pillar-name-${index}`}
                            placeholder="e.g., Task, Persona, Context"
                            value={pillar.name}
                            onChange={(e) => handlePillarChange(index, 'name', e.target.value)}
                            maxLength={50}
                          />
                          
                          <Label htmlFor={`pillar-description-${index}`}>Description</Label>
                          <Textarea
                            id={`pillar-description-${index}`}
                            placeholder="Describe what this pillar should contain..."
                            value={pillar.description}
                            onChange={(e) => handlePillarChange(index, 'description', e.target.value)}
                            rows={2}
                            maxLength={200}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="temperature">Temperature: {(newTemplateTemperature / 10).toFixed(1)}</Label>
                      </div>
                      <Slider
                        id="temperature"
                        min={0}
                        max={20}
                        step={1}
                        value={[newTemplateTemperature]}
                        onValueChange={(values) => setNewTemplateTemperature(values[0])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>More precise</span>
                        <span>More creative</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="max-chars">Maximum Characters: {newTemplateMaxChars}</Label>
                      </div>
                      <Slider
                        id="max-chars"
                        min={1000}
                        max={10000}
                        step={500}
                        value={[newTemplateMaxChars]}
                        onValueChange={(values) => setNewTemplateMaxChars(values[0])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>Shorter</span>
                        <span>Longer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTemplate} 
                  disabled={!newTemplateName.trim() || isLoading}
                >
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="flex space-x-2">
        <Select
          value={selectedTemplate?.id || ""}
          onValueChange={handleTemplateChange}
          disabled={isLoading || templates.length === 0}
        >
          <SelectTrigger id="template-select" className="w-full">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedTemplate && (
          <div className="flex space-x-1">
            {isLoggedIn && onUpdateTemplate && !selectedTemplate.is_default && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEditTemplate(selectedTemplate)}
                disabled={isLoading}
                className="h-10 w-10"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            
            {isLoggedIn && onCreateTemplate && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDuplicateTemplate(selectedTemplate)}
                disabled={isLoading}
                className="h-10 w-10"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      {selectedTemplate && (
        <p className="text-sm text-muted-foreground">
          {selectedTemplate.description || 
            "This template will help structure your prompt for better results."}
        </p>
      )}
      
      {/* Edit Template Dialog */}
      {isLoggedIn && onUpdateTemplate && onDeleteTemplate && editingTemplate && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Modify your prompt template settings.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-template-name">Template Name</Label>
                  <Input
                    id="edit-template-name"
                    placeholder="e.g., My Custom Framework"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-template-description">Description</Label>
                  <Textarea
                    id="edit-template-description"
                    placeholder="Describe what this template is designed for..."
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    rows={2}
                    maxLength={500}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-system-prefix">System Prefix</Label>
                  <Textarea
                    id="edit-system-prefix"
                    placeholder="You are an expert prompt engineer that transforms input prompts..."
                    value={newTemplateSystemPrefix}
                    onChange={(e) => setNewTemplateSystemPrefix(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the initial instruction given to the AI. It sets the tone and approach.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Framework Pillars</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddPillar}
                      className="h-7 px-2"
                    >
                      Add Pillar
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {newTemplatePillars.map((pillar, index) => (
                      <div key={index} className="space-y-2 border p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <Label htmlFor={`edit-pillar-name-${index}`}>Pillar Name</Label>
                          {newTemplatePillars.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePillar(index)}
                              className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <Input
                          id={`edit-pillar-name-${index}`}
                          placeholder="e.g., Task, Persona, Context"
                          value={pillar.name}
                          onChange={(e) => handlePillarChange(index, 'name', e.target.value)}
                          maxLength={50}
                        />
                        
                        <Label htmlFor={`edit-pillar-description-${index}`}>Description</Label>
                        <Textarea
                          id={`edit-pillar-description-${index}`}
                          placeholder="Describe what this pillar should contain..."
                          value={pillar.description}
                          onChange={(e) => handlePillarChange(index, 'description', e.target.value)}
                          rows={2}
                          maxLength={200}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="edit-temperature">Temperature: {(newTemplateTemperature / 10).toFixed(1)}</Label>
                    </div>
                    <Slider
                      id="edit-temperature"
                      min={0}
                      max={20}
                      step={1}
                      value={[newTemplateTemperature]}
                      onValueChange={(values) => setNewTemplateTemperature(values[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>More precise</span>
                      <span>More creative</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="edit-max-chars">Maximum Characters: {newTemplateMaxChars}</Label>
                    </div>
                    <Slider
                      id="edit-max-chars"
                      min={1000}
                      max={10000}
                      step={500}
                      value={[newTemplateMaxChars]}
                      onValueChange={(values) => setNewTemplateMaxChars(values[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>Shorter</span>
                      <span>Longer</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <DialogFooter className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={handleDeleteTemplate}
                disabled={isLoading}
              >
                Delete
              </Button>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateTemplate} 
                  disabled={!newTemplateName.trim() || isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
