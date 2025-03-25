
import { useState, useEffect } from 'react';
import { PromptTemplate, PromptPillar } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { usePromptTemplates } from '@/hooks/usePromptTemplates';
import { useToast } from '@/hooks/use-toast';

export const TemplateManager = ({ userId }: { userId: string | undefined }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateSystemPrefix, setNewTemplateSystemPrefix] = useState('');
  const [newTemplateTemperature, setNewTemplateTemperature] = useState(0.7);
  const [newTemplateMaxChars, setNewTemplateMaxChars] = useState(4000);
  const [newTemplatePillars, setNewTemplatePillars] = useState<PromptPillar[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { 
    templates, 
    isLoading, 
    fetchTemplates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate 
  } = usePromptTemplates(userId);

  // Set up default pillars for new template
  const setupDefaultPillars = () => {
    return [
      {
        id: crypto.randomUUID(),
        name: 'Task',
        content: 'Define the specific job or action to be performed.',
        order: 0,
        isEditable: true
      },
      {
        id: crypto.randomUUID(),
        name: 'Persona',
        content: 'Specify who the AI should embody or what role it should assume.',
        order: 1,
        isEditable: true
      },
      {
        id: crypto.randomUUID(),
        name: 'Conditions',
        content: 'Set parameters, constraints, and context for the task.',
        order: 2,
        isEditable: true
      },
      {
        id: crypto.randomUUID(),
        name: 'Instructions',
        content: 'Provide step-by-step guidance on how to accomplish the task.',
        order: 3,
        isEditable: true
      }
    ];
  };

  // Handle creating or editing a template
  const handleOpenEditDialog = (template: PromptTemplate | null = null) => {
    if (template) {
      // Editing existing template
      setEditingTemplate(template);
      setNewTemplateTitle(template.title);
      setNewTemplateDescription(template.description || '');
      setNewTemplateSystemPrefix(template.systemPrefix || '');
      setNewTemplateTemperature(template.temperature);
      setNewTemplateMaxChars(template.maxChars || 4000);
      setNewTemplatePillars([...template.pillars]);
    } else {
      // Creating new template
      setEditingTemplate(null);
      setNewTemplateTitle('');
      setNewTemplateDescription('');
      setNewTemplateSystemPrefix('You are an expert prompt engineer that transforms input prompts into highly effective, well-structured prompts.');
      setNewTemplateTemperature(0.7);
      setNewTemplateMaxChars(4000);
      setNewTemplatePillars(setupDefaultPillars());
    }
    setIsEditDialogOpen(true);
  };

  // Add a new pillar to the template
  const handleAddPillar = () => {
    const newPillar: PromptPillar = {
      id: crypto.randomUUID(),
      name: 'New Section',
      content: 'Describe what this section is for.',
      order: newTemplatePillars.length,
      isEditable: true
    };
    setNewTemplatePillars([...newTemplatePillars, newPillar]);
  };

  // Delete a pillar from the template
  const handleDeletePillar = (pillarId: string) => {
    const updatedPillars = newTemplatePillars
      .filter(pillar => pillar.id !== pillarId)
      .map((pillar, index) => ({ ...pillar, order: index }));
    setNewTemplatePillars(updatedPillars);
  };

  // Move a pillar up in the order
  const handleMovePillarUp = (index: number) => {
    if (index <= 0) return;
    const updatedPillars = [...newTemplatePillars];
    [updatedPillars[index - 1], updatedPillars[index]] = [updatedPillars[index], updatedPillars[index - 1]];
    updatedPillars.forEach((pillar, i) => pillar.order = i);
    setNewTemplatePillars(updatedPillars);
  };

  // Move a pillar down in the order
  const handleMovePillarDown = (index: number) => {
    if (index >= newTemplatePillars.length - 1) return;
    const updatedPillars = [...newTemplatePillars];
    [updatedPillars[index], updatedPillars[index + 1]] = [updatedPillars[index + 1], updatedPillars[index]];
    updatedPillars.forEach((pillar, i) => pillar.order = i);
    setNewTemplatePillars(updatedPillars);
  };

  // Update a pillar's properties
  const handleUpdatePillar = (index: number, field: 'name' | 'content', value: string) => {
    const updatedPillars = [...newTemplatePillars];
    updatedPillars[index] = { ...updatedPillars[index], [field]: value };
    setNewTemplatePillars(updatedPillars);
  };

  // Save template (create or update)
  const handleSaveTemplate = async () => {
    if (!newTemplateTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your template",
        variant: "destructive"
      });
      return;
    }

    if (newTemplatePillars.length === 0) {
      toast({
        title: "Sections required",
        description: "Your template needs at least one section",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const templateData = {
      title: newTemplateTitle,
      description: newTemplateDescription,
      systemPrefix: newTemplateSystemPrefix,
      pillars: newTemplatePillars,
      maxChars: newTemplateMaxChars,
      temperature: newTemplateTemperature
    };

    try {
      if (editingTemplate) {
        // Update existing template
        await updateTemplate(editingTemplate.id!, templateData);
      } else {
        // Create new template
        await createTemplate(templateData);
      }
      
      setIsEditDialogOpen(false);
      await fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      await deleteTemplate(templateId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Template Management</h2>
        <Button onClick={() => handleOpenEditDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <h3 className="text-xl font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-6">
            Create your first template to structure your prompts
          </p>
          <Button onClick={() => handleOpenEditDialog()}>Create Template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card key={template.id} className={`border ${template.isDefault ? 'border-accent' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{template.title}</CardTitle>
                    {template.isDefault && (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-accent/20 text-accent mt-1">
                        Default
                      </span>
                    )}
                  </div>
                  {!template.isDefault && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenEditDialog(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteTemplate(template.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardDescription>
                  {template.description || `Template with ${template.pillars.length} sections`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sections:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-5 list-disc">
                    {template.pillars.map(pillar => (
                      <li key={pillar.id}>{pillar.name}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between text-xs text-muted-foreground">
                  <span>Temperature: {template.temperature}</span>
                  <span>Max chars: {template.maxChars || 'Default'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              Templates define the structure and sections used to enhance prompts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic template settings */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-title">Title</Label>
                <Input
                  id="template-title"
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  placeholder="Template title"
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Brief description of this template"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="template-system-prefix">System Prefix</Label>
                <Textarea
                  id="template-system-prefix"
                  value={newTemplateSystemPrefix}
                  onChange={(e) => setNewTemplateSystemPrefix(e.target.value)}
                  placeholder="System message to use with this template"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-temperature">
                    Temperature: {newTemplateTemperature.toFixed(1)}
                  </Label>
                  <Slider
                    id="template-temperature"
                    value={[newTemplateTemperature]}
                    min={0.1}
                    max={1}
                    step={0.1}
                    onValueChange={(value) => setNewTemplateTemperature(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower values produce more consistent results, higher values more creative ones.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-max-chars">Max Characters</Label>
                  <Input
                    id="template-max-chars"
                    type="number"
                    value={newTemplateMaxChars}
                    onChange={(e) => setNewTemplateMaxChars(Number(e.target.value))}
                    min={500}
                    max={10000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum characters for the enhanced prompt.
                  </p>
                </div>
              </div>
            </div>

            {/* Template sections */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Template Sections</Label>
                <Button size="sm" variant="outline" onClick={handleAddPillar}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Section
                </Button>
              </div>

              <div className="space-y-4">
                {newTemplatePillars.map((pillar, index) => (
                  <div key={pillar.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <Input
                        value={pillar.name}
                        onChange={(e) => handleUpdatePillar(index, 'name', e.target.value)}
                        placeholder="Section name"
                        className="max-w-xs"
                        disabled={!pillar.isEditable}
                      />
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMovePillarUp(index)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMovePillarDown(index)}
                          disabled={index === newTemplatePillars.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePillar(pillar.id)}
                          disabled={!pillar.isEditable || newTemplatePillars.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Textarea
                      value={pillar.content}
                      onChange={(e) => handleUpdatePillar(index, 'content', e.target.value)}
                      placeholder="Description of this section"
                      rows={2}
                      disabled={!pillar.isEditable}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
