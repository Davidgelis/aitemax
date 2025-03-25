
import { useState, useEffect } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TemplateCard } from "@/components/dashboard/TemplateCard";
import { PromptTemplate } from "@/components/dashboard/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TemplatesPanelProps {
  userId: string | undefined;
  onSelectTemplate: (templateId: string | null) => void;
}

export const TemplatesPanel = ({ userId, onSelectTemplate }: TemplatesPanelProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<"create" | "edit">("create");
  const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrefix, setSystemPrefix] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxChars, setMaxChars] = useState(4000);
  
  // Load templates
  useEffect(() => {
    fetchTemplates();
    
    // Try to load the selected template from localStorage
    const savedTemplateId = localStorage.getItem('selectedTemplateId');
    if (savedTemplateId) {
      setSelectedTemplateId(savedTemplateId);
    }
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Convert data to PromptTemplate format
      const formattedTemplates: PromptTemplate[] = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || "",
        systemPrefix: item.system_prefix || "",
        pillars: item.pillars || [],
        isDefault: item.is_default,
        maxChars: item.max_chars || 4000,
        temperature: item.temperature || 0.7,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      setTemplates(formattedTemplates);
    } catch (error: any) {
      console.error("Error fetching templates:", error.message);
      toast({
        title: "Error fetching templates",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter templates based on search term
  const filteredTemplates = templates.filter(
    template => template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    // Toggle selection - selecting already selected template deselects it
    const newSelectedId = selectedTemplateId === templateId ? null : templateId;
    setSelectedTemplateId(newSelectedId);
    onSelectTemplate(newSelectedId);
  };
  
  // Open the template dialog for creating a new template
  const handleNewTemplate = () => {
    setDialogAction("create");
    setCurrentTemplate(null);
    resetForm();
    setShowTemplateDialog(true);
  };
  
  // Open the template dialog for editing an existing template
  const handleEditTemplate = (template: PromptTemplate) => {
    setDialogAction("edit");
    setCurrentTemplate(template);
    
    // Populate form with template data
    setTitle(template.title);
    setDescription(template.description || "");
    setSystemPrefix(template.systemPrefix || "");
    setTemperature(template.temperature || 0.7);
    setMaxChars(template.maxChars || 4000);
    
    setShowTemplateDialog(true);
  };
  
  // Reset form values
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSystemPrefix("");
    setTemperature(0.7);
    setMaxChars(4000);
  };
  
  // Save template (create or update)
  const handleSaveTemplate = async () => {
    if (!title) {
      toast({
        title: "Missing information",
        description: "Template title is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const templateData = {
        title,
        description,
        system_prefix: systemPrefix,
        pillars: currentTemplate?.pillars || [],
        temperature,
        max_chars: maxChars,
        user_id: userId
      };
      
      if (dialogAction === "create") {
        // Create new template
        const { data, error } = await supabase
          .from('prompt_templates')
          .insert(templateData)
          .select()
          .single();
          
        if (error) throw error;
        
        const newTemplate: PromptTemplate = {
          id: data.id,
          title: data.title,
          description: data.description || "",
          systemPrefix: data.system_prefix || "",
          pillars: data.pillars || [],
          isDefault: false,
          maxChars: data.max_chars || 4000,
          temperature: data.temperature || 0.7,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        
        setTemplates(prev => [newTemplate, ...prev]);
        
        toast({
          title: "Template created",
          description: "Your new template has been created successfully"
        });
      } else {
        // Update existing template
        if (!currentTemplate) return;
        
        const { error } = await supabase
          .from('prompt_templates')
          .update(templateData)
          .eq('id', currentTemplate.id);
          
        if (error) throw error;
        
        // Update the template in the local state
        setTemplates(prev => prev.map(t => 
          t.id === currentTemplate.id 
            ? { 
                ...t, 
                title, 
                description, 
                systemPrefix, 
                temperature, 
                maxChars,
                updatedAt: new Date().toISOString()
              } 
            : t
        ));
        
        toast({
          title: "Template updated",
          description: "Your template has been updated successfully"
        });
      }
      
      // Close the dialog
      setShowTemplateDialog(false);
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Duplicate a template
  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      const templateToDuplicate = templates.find(t => t.id === templateId);
      if (!templateToDuplicate) return;
      
      const { data, error } = await supabase
        .from('prompt_templates')
        .insert({
          title: `${templateToDuplicate.title} (Copy)`,
          description: templateToDuplicate.description,
          system_prefix: templateToDuplicate.systemPrefix,
          pillars: templateToDuplicate.pillars,
          temperature: templateToDuplicate.temperature,
          max_chars: templateToDuplicate.maxChars,
          user_id: userId,
          is_default: false
        })
        .select()
        .single();
        
      if (error) throw error;
      
      const newTemplate: PromptTemplate = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        systemPrefix: data.system_prefix || "",
        pillars: data.pillars || [],
        isDefault: false,
        maxChars: data.max_chars || 4000,
        temperature: data.temperature || 0.7,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      setTemplates(prev => [newTemplate, ...prev]);
      
      toast({
        title: "Template duplicated",
        description: "A copy of the template has been created"
      });
    } catch (error: any) {
      console.error("Error duplicating template:", error);
      toast({
        title: "Error duplicating template",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Delete a template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // Check if this is the currently selected template
      if (selectedTemplateId === templateId) {
        // Deselect it first
        setSelectedTemplateId(null);
        onSelectTemplate(null);
        localStorage.removeItem('selectedTemplateId');
      }
      
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', templateId);
        
      if (error) throw error;
      
      // Remove the template from the local state
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header with search and create button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Input 
            placeholder="Search templates..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4 pr-4 w-full"
          />
        </div>
        
        <Button 
          onClick={handleNewTemplate}
          className="sm:w-auto w-full"
          variant="aurora"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>
      
      {/* Information alert for users */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>What are prompt templates?</AlertTitle>
        <AlertDescription>
          Templates help structure your prompts consistently following specific frameworks.
          Select a template before creating a new prompt to use its structure.
        </AlertDescription>
      </Alert>
      
      {/* Templates grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredTemplates.map(template => (
            <TemplateCard 
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={handleTemplateSelect}
              onEdit={handleEditTemplate}
              onDuplicate={handleDuplicateTemplate}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? "Try adjusting your search" : "You haven't created any custom templates yet"}
          </p>
          {!searchTerm && (
            <Button variant="aurora" onClick={handleNewTemplate}>
              Create Your First Template
            </Button>
          )}
        </div>
      )}
      
      {/* Template Edit/Create Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{dialogAction === "create" ? "Create New Template" : "Edit Template"}</DialogTitle>
            <DialogDescription>
              Define how your prompt will be structured and enhanced.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Template Name</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Four-Pillar Framework"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="A structured framework for organizing prompt elements"
                rows={2}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="systemPrefix">System Prefix</Label>
              <Textarea 
                id="systemPrefix" 
                value={systemPrefix} 
                onChange={(e) => setSystemPrefix(e.target.value)} 
                placeholder="You are an expert prompt engineer that transforms input prompts into highly effective, well-structured prompts..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Instructions for the AI on how to process and enhance the prompt
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="temperature">Temperature: {temperature}</Label>
              <Slider 
                id="temperature"
                value={[temperature]} 
                onValueChange={(value) => setTemperature(value[0])} 
                min={0} 
                max={1} 
                step={0.1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>More structured (0.0)</span>
                <span>More creative (1.0)</span>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxChars">Maximum Characters: {maxChars}</Label>
              <Slider 
                id="maxChars"
                value={[maxChars]} 
                onValueChange={(value) => setMaxChars(value[0])} 
                min={1000} 
                max={10000} 
                step={500}
              />
              <p className="text-xs text-muted-foreground">
                Maximum length of the final generated prompt
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {dialogAction === "create" ? "Create Template" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
