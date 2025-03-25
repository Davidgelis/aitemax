
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, FileText, Plus, Save, Trash, Wand2 } from "lucide-react";
import { PromptTemplate, PromptPillar } from "./types";
import { useTemplates } from "@/hooks/useTemplates";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TemplateSelectorProps {
  onSelectTemplate: (template: PromptTemplate) => void;
}

export const TemplateSelector = ({ onSelectTemplate }: TemplateSelectorProps) => {
  const { 
    templates, 
    selectedTemplate, 
    setSelectedTemplate, 
    isLoading, 
    addTemplate, 
    editTemplate, 
    removeTemplate 
  } = useTemplates();
  
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<PromptTemplate>>({
    title: "",
    description: "",
    pillars: [],
    maxChars: 4000,
    temperature: 0.7,
    systemPrefix: ""
  });
  
  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    onSelectTemplate(template);
    setIsOpen(false);
  };
  
  const handleCreateTemplate = () => {
    setIsEditing(true);
    setEditingTemplate({
      title: "New Template",
      description: "Custom prompt template",
      pillars: [
        {
          id: uuidv4(),
          name: "Task",
          content: "Define the specific task or objective that needs to be accomplished.",
          order: 1,
          isEditable: true,
        },
        {
          id: uuidv4(),
          name: "Persona",
          content: "Specify the role, expertise level, or character the AI should adopt.",
          order: 2,
          isEditable: true,
        },
        {
          id: uuidv4(),
          name: "Conditions",
          content: "Set boundaries, constraints, and specific requirements to shape the response.",
          order: 3,
          isEditable: true,
        },
        {
          id: uuidv4(),
          name: "Instructions",
          content: "Provide detailed guidance on how to complete the task.",
          order: 4,
          isEditable: true,
        }
      ],
      maxChars: 4000,
      temperature: 0.7,
      systemPrefix: "You are an expert prompt engineer that transforms input prompts into highly effective, well-structured prompts."
    });
  };
  
  const handleEditTemplate = (template: PromptTemplate) => {
    setIsEditing(true);
    setEditingTemplate({
      ...template,
      pillars: [...template.pillars.map(p => ({ ...p }))]
    });
  };
  
  const handleAddPillar = () => {
    if (editingTemplate.pillars) {
      const newPillars = [...editingTemplate.pillars];
      newPillars.push({
        id: uuidv4(),
        name: "New Section",
        content: "Description of this section",
        order: newPillars.length + 1,
        isEditable: true
      });
      setEditingTemplate({ ...editingTemplate, pillars: newPillars });
    }
  };
  
  const handleUpdatePillar = (id: string, field: keyof PromptPillar, value: string | number | boolean) => {
    if (editingTemplate.pillars) {
      const updatedPillars = editingTemplate.pillars.map(pillar => 
        pillar.id === id ? { ...pillar, [field]: value } : pillar
      );
      setEditingTemplate({ ...editingTemplate, pillars: updatedPillars });
    }
  };
  
  const handleRemovePillar = (id: string) => {
    if (editingTemplate.pillars) {
      // Filter out the removed pillar
      const updatedPillars = editingTemplate.pillars.filter(pillar => pillar.id !== id);
      
      // Reorder the remaining pillars
      const reorderedPillars = updatedPillars.map((pillar, index) => ({
        ...pillar,
        order: index + 1
      }));
      
      setEditingTemplate({ ...editingTemplate, pillars: reorderedPillars });
    }
  };
  
  const handleSaveTemplate = async () => {
    if (!editingTemplate.title) {
      toast({
        title: "Error",
        description: "Template title is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (editingTemplate.id) {
        await editTemplate(editingTemplate.id, editingTemplate);
      } else {
        const newTemplate = await addTemplate(editingTemplate);
        setSelectedTemplate(newTemplate);
        onSelectTemplate(newTemplate);
      }
      
      setIsEditing(false);
      setEditingTemplate({
        title: "",
        description: "",
        pillars: [],
        maxChars: 4000,
        temperature: 0.7,
        systemPrefix: ""
      });
    } catch (err) {
      console.error("Failed to save template:", err);
    }
  };
  
  const handleCloneTemplate = (template: PromptTemplate) => {
    const clonedTemplate: Partial<PromptTemplate> = {
      title: `${template.title} (Copy)`,
      description: template.description,
      pillars: [...template.pillars.map(p => ({ ...p, id: uuidv4() }))],
      maxChars: template.maxChars,
      temperature: template.temperature,
      systemPrefix: template.systemPrefix
    };
    
    setIsEditing(true);
    setEditingTemplate(clonedTemplate);
  };
  
  const handleDeleteTemplate = async (id: string) => {
    await removeTemplate(id);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={() => setIsOpen(true)}
        >
          <FileText className="w-4 h-4" />
          <span>{selectedTemplate?.title || "Select Template"}</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prompt Templates</DialogTitle>
          <DialogDescription>
            Select a template or create your own to structure your prompts.
          </DialogDescription>
        </DialogHeader>
        
        {isEditing ? (
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Template Name</Label>
                <Input 
                  id="title" 
                  value={editingTemplate.title || ''} 
                  onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  placeholder="Template name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxChars">Max Characters</Label>
                  <Input 
                    id="maxChars" 
                    type="number"
                    value={editingTemplate.maxChars || 4000} 
                    onChange={e => setEditingTemplate({ ...editingTemplate, maxChars: parseInt(e.target.value) })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input 
                    id="temperature" 
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editingTemplate.temperature || 0.7} 
                    onChange={e => setEditingTemplate({ ...editingTemplate, temperature: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={editingTemplate.description || ''} 
                onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                placeholder="Describe what this template is for"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="systemPrefix">System Prefix</Label>
              <Textarea 
                id="systemPrefix" 
                value={editingTemplate.systemPrefix || ''} 
                onChange={e => setEditingTemplate({ ...editingTemplate, systemPrefix: e.target.value })}
                placeholder="Instructions for the AI system"
                rows={4}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Template Sections</Label>
              <Button size="sm" variant="outline" onClick={handleAddPillar}>
                <Plus className="w-4 h-4 mr-1" /> Add Section
              </Button>
            </div>
            
            <ScrollArea className="flex-1 max-h-80">
              <div className="space-y-4">
                {editingTemplate.pillars?.map((pillar, index) => (
                  <Card key={pillar.id}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <Input 
                          value={pillar.name} 
                          onChange={e => handleUpdatePillar(pillar.id, 'name', e.target.value)}
                          className="font-medium"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemovePillar(pillar.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Textarea 
                        value={pillar.content} 
                        onChange={e => handleUpdatePillar(pillar.id, 'content', e.target.value)}
                        placeholder="Description of this section"
                        rows={2}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={handleCreateTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
            
            <ScrollArea className="h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  <div className="col-span-2 flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="col-span-2 text-center p-8">
                    <p className="text-muted-foreground">No templates found. Create your first template.</p>
                  </div>
                ) : (
                  templates.map(template => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all hover:border-primary ${
                        selectedTemplate?.id === template.id ? 'border-primary' : ''
                      }`}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-2">
                          {template.isDefault && (
                            <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                              Default
                            </span>
                          )}
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                        </div>
                        {template.description && (
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent className="p-4 pt-0">
                        <div className="text-sm">
                          <p className="font-semibold">Sections:</p>
                          <ul className="list-disc list-inside pl-2">
                            {template.pillars.map(pillar => (
                              <li key={pillar.id}>{pillar.name}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleSelectTemplate(template)}
                        >
                          Select
                        </Button>
                        
                        <div className="flex gap-2">
                          {!template.isDefault && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditTemplate(template)}
                              >
                                <Wand2 className="w-4 h-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the "{template.title}" template? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCloneTemplate(template)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
