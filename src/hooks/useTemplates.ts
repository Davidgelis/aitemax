
import { useState, useEffect } from "react";
import { PromptTemplate, PromptPillar } from "@/components/dashboard/types";
import { 
  fetchTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} from "@/services/templates";
import { useToast } from "@/hooks/use-toast";

export const useTemplates = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTemplates();
      setTemplates(data);
      // If there's no selected template yet, select the default one
      if (!selectedTemplate && data.length > 0) {
        setSelectedTemplate(data.find(t => t.isDefault) || data[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load templates");
      toast({
        title: "Error",
        description: "Failed to load prompt templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTemplate = async (template: Partial<PromptTemplate>) => {
    setIsLoading(true);
    try {
      const newTemplate = await createTemplate(template);
      setTemplates(prev => [newTemplate, ...prev]);
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      return newTemplate;
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const editTemplate = async (id: string, template: Partial<PromptTemplate>) => {
    setIsLoading(true);
    try {
      const updatedTemplate = await updateTemplate(id, template);
      setTemplates(prev => 
        prev.map(t => t.id === id ? updatedTemplate : t)
      );
      
      // Update selected template if it's the one being edited
      if (selectedTemplate && selectedTemplate.id === id) {
        setSelectedTemplate(updatedTemplate);
      }
      
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      return updatedTemplate;
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteTemplate(id);
      
      const updatedTemplates = templates.filter(t => t.id !== id);
      setTemplates(updatedTemplates);
      
      // If the deleted template was selected, select another one
      if (selectedTemplate && selectedTemplate.id === id) {
        setSelectedTemplate(updatedTemplates.length > 0 ? 
          updatedTemplates.find(t => t.isDefault) || updatedTemplates[0] : null);
      }
      
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    selectedTemplate,
    setSelectedTemplate,
    isLoading,
    error,
    loadTemplates,
    addTemplate,
    editTemplate,
    removeTemplate
  };
};
