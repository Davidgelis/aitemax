
import { useState, Fragment } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PromptTemplate, PromptPillar } from './types';
import { usePromptTemplates } from '@/hooks/usePromptTemplates';
import { PlusCircle, Edit, Trash2, Copy, AlertCircle, Check, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TemplateManagerProps {
  userId?: string;
}

export const TemplateManager = ({ userId }: TemplateManagerProps) => {
  const {
    templates,
    selectedTemplate,
    isLoading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setSelectedTemplate
  } = usePromptTemplates(userId);

  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // New template form state
  const [formState, setFormState] = useState<{
    title: string;
    description: string;
    pillars: PromptPillar[];
    systemPrefix: string;
    maxChars: number;
    temperature: number;
  }>({
    title: '',
    description: '',
    pillars: [],
    systemPrefix: '',
    maxChars: 4000,
    temperature: 0.7
  });

  const resetFormState = () => {
    setFormState({
      title: '',
      description: '',
      pillars: [],
      systemPrefix: '',
      maxChars: 4000,
      temperature: 0.7
    });
    setErrors({});
  };

  const handleStartCreate = () => {
    setEditingTemplate(null);
    setIsCreating(true);
    resetFormState();
    setFormState(prev => ({
      ...prev,
      pillars: [
        { id: uuidv4(), name: 'Task', content: '', order: 0, isEditable: true },
        { id: uuidv4(), name: 'Persona', content: '', order: 1, isEditable: true },
        { id: uuidv4(), name: 'Conditions', content: '', order: 2, isEditable: true },
        { id: uuidv4(), name: 'Instructions', content: '', order: 3, isEditable: true }
      ]
    }));
    setShowDialog(true);
  };

  const handleStartEdit = (template: PromptTemplate) => {
    setIsCreating(false);
    setEditingTemplate(template);
    setFormState({
      title: template.title,
      description: template.description || '',
      pillars: [...template.pillars], // Clone to avoid modifying the original
      systemPrefix: template.systemPrefix || '',
      maxChars: template.maxChars || 4000,
      temperature: template.temperature || 0.7
    });
    setShowDialog(true);
  };

  const handleConfirmDelete = async (templateId: string) => {
    const success = await deleteTemplate(templateId);
    if (success) {
      setTemplateToDelete(null);
    }
  };

  const handleCloneTemplate = (template: PromptTemplate) => {
    setIsCreating(true);
    setEditingTemplate(null);
    setFormState({
      title: `${template.title} (Copy)`,
      description: template.description || '',
      // Clone pillars with new IDs
      pillars: template.pillars.map(pillar => ({
        ...pillar,
        id: uuidv4(),
        isEditable: true // All pillars are editable in a cloned template
      })),
      systemPrefix: template.systemPrefix || '',
      maxChars: template.maxChars || 4000,
      temperature: template.temperature || 0.7
    });
    setShowDialog(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: name === 'maxChars' || name === 'temperature' ? parseFloat(value) : value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePillarChange = (pillarId: string, field: keyof PromptPillar, value: string | number) => {
    setFormState(prev => ({
      ...prev,
      pillars: prev.pillars.map(pillar => 
        pillar.id === pillarId 
          ? { ...pillar, [field]: value } 
          : pillar
      )
    }));
    
    // Clear any pillar errors
    if (errors[`pillar-${pillarId}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`pillar-${pillarId}`];
        return newErrors;
      });
    }
  };

  const handleAddPillar = () => {
    const newOrder = formState.pillars.length > 0 
      ? Math.max(...formState.pillars.map(p => p.order)) + 1 
      : 0;
    
    setFormState(prev => ({
      ...prev,
      pillars: [
        ...prev.pillars,
        { id: uuidv4(), name: '', content: '', order: newOrder, isEditable: true }
      ]
    }));
  };

  const handleRemovePillar = (pillarId: string) => {
    setFormState(prev => ({
      ...prev,
      pillars: prev.pillars.filter(pillar => pillar.id !== pillarId)
    }));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(formState.pillars);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update the order of each item
    const updatedPillars = items.map((item, index) => ({
      ...item,
      order: index
    }));
    
    setFormState(prev => ({
      ...prev,
      pillars: updatedPillars
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formState.title.trim()) {
      newErrors.title = 'Template title is required';
    }
    
    if (formState.pillars.length === 0) {
      newErrors.pillars = 'At least one pillar is required';
    }
    
    formState.pillars.forEach(pillar => {
      if (!pillar.name.trim()) {
        newErrors[`pillar-${pillar.id}`] = 'Pillar name is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (isCreating) {
      const newTemplate = await createTemplate({
        title: formState.title,
        description: formState.description,
        isDefault: false,
        pillars: formState.pillars,
        systemPrefix: formState.systemPrefix,
        maxChars: formState.maxChars,
        temperature: formState.temperature
      });
      
      if (newTemplate) {
        setShowDialog(false);
        resetFormState();
      }
    } else if (editingTemplate) {
      const updatedTemplate: PromptTemplate = {
        ...editingTemplate,
        title: formState.title,
        description: formState.description,
        pillars: formState.pillars,
        systemPrefix: formState.systemPrefix,
        maxChars: formState.maxChars,
        temperature: formState.temperature
      };
      
      const success = await updateTemplate(updatedTemplate);
      if (success) {
        setShowDialog(false);
        setEditingTemplate(null);
        resetFormState();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Prompt Templates</h2>
        <Button variant="aurora" onClick={handleStartCreate}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Create and manage prompt templates to standardize your prompts and improve consistency.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-muted/30">
          <p className="mb-4 text-muted-foreground">No templates found. Create your first template to get started.</p>
          <Button variant="aurora" onClick={handleStartCreate}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id} className={`border ${template.isDefault ? 'border-[#64bf95]' : 'border-border'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{template.title}</CardTitle>
                    {template.isDefault && (
                      <span className="text-xs px-2 py-0.5 bg-[#64bf95]/10 text-[#64bf95] rounded-full inline-block mt-1">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCloneTemplate(template)}
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clone template</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {!template.isDefault && (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleStartEdit(template)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit template</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => setTemplateToDelete(template.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete template</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </div>
                </div>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Sections ({template.pillars.length})</div>
                  <div className="text-sm">
                    {template.pillars
                      .sort((a, b) => a.order - b.order)
                      .map((pillar, index) => (
                        <div key={pillar.id} className="flex items-center gap-2 mb-1">
                          <div className="h-4 w-4 rounded-full bg-[#64bf95]/20 text-xs flex items-center justify-center text-[#64bf95]">
                            {index + 1}
                          </div>
                          <span>{pillar.name}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={selectedTemplate?.id === template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  {selectedTemplate?.id === template.id ? 'Current Default' : 'Set as Default'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Template Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Create New Template' : 'Edit Template'}
            </DialogTitle>
            <DialogDescription>
              {isCreating 
                ? 'Create a new prompt template to use for your prompts.' 
                : 'Edit your prompt template settings and sections.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="sections">Template Sections</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Template Name</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      value={formState.title} 
                      onChange={handleInputChange}
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive">{errors.title}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      value={formState.description} 
                      onChange={handleInputChange}
                      className="resize-none h-20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="systemPrefix">
                      System Prefix (Optional)
                      <span className="ml-2 text-xs text-muted-foreground">
                        Initial system message for the AI
                      </span>
                    </Label>
                    <Textarea 
                      id="systemPrefix" 
                      name="systemPrefix" 
                      value={formState.systemPrefix} 
                      onChange={handleInputChange}
                      className="resize-none h-20"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxChars">
                        Max Characters
                        <span className="ml-2 text-xs text-muted-foreground">
                          Maximum allowed length
                        </span>
                      </Label>
                      <Input 
                        id="maxChars" 
                        name="maxChars" 
                        type="number"
                        min="1000"
                        max="10000"
                        value={formState.maxChars} 
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="temperature">
                        Temperature
                        <span className="ml-2 text-xs text-muted-foreground">
                          AI creativity (0.1-1.0)
                        </span>
                      </Label>
                      <Input 
                        id="temperature" 
                        name="temperature" 
                        type="number"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={formState.temperature} 
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sections" className="space-y-4 mt-4">
                {errors.pillars && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.pillars}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex items-center justify-between">
                  <Label>Template Sections</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddPillar}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
                
                <ScrollArea className="h-[350px] pr-4">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="pillars">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-4"
                        >
                          {formState.pillars
                            .sort((a, b) => a.order - b.order)
                            .map((pillar, index) => (
                              <Draggable
                                key={pillar.id}
                                draggableId={pillar.id}
                                index={index}
                                isDragDisabled={!pillar.isEditable}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`border rounded-lg p-4 ${
                                      errors[`pillar-${pillar.id}`] ? 'border-destructive' : ''
                                    }`}
                                  >
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-sm">Section {index + 1}</Label>
                                        {pillar.isEditable && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemovePillar(pillar.id)}
                                            className="h-6 w-6 text-destructive"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Input
                                          placeholder="Section name (e.g., Task, Persona)"
                                          value={pillar.name}
                                          onChange={(e) => handlePillarChange(pillar.id, 'name', e.target.value)}
                                          disabled={!pillar.isEditable}
                                        />
                                        {errors[`pillar-${pillar.id}`] && (
                                          <p className="text-xs text-destructive">{errors[`pillar-${pillar.id}`]}</p>
                                        )}
                                        
                                        <Textarea
                                          placeholder="Default content or instructions for this section"
                                          value={pillar.content}
                                          onChange={(e) => handlePillarChange(pillar.id, 'content', e.target.value)}
                                          className="resize-none h-20"
                                          disabled={!pillar.isEditable}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button variant="aurora" onClick={handleSubmit}>
              {isCreating ? 'Create Template' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setTemplateToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => templateToDelete && handleConfirmDelete(templateToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

