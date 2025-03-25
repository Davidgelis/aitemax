
import { useState, useEffect } from "react";
import { PromptTemplate, PromptPillar, jsonToPillars, templatePillarsToJson } from "@/components/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export const usePromptTemplates = (userId: string | undefined) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const { toast } = useToast();

  // Fetch all templates (default templates and user's templates)
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

      // Convert the data to our frontend types
      const formattedTemplates: PromptTemplate[] = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || undefined,
        isDefault: item.is_default,
        pillars: jsonToPillars(item.pillars as Json),
        systemPrefix: item.system_prefix || undefined,
        maxChars: item.max_chars || undefined,
        temperature: item.temperature || 0.7,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_id: item.user_id
      }));

      setTemplates(formattedTemplates);

      // If no template is selected, select the first default template
      if (!selectedTemplate && formattedTemplates.length > 0) {
        const defaultTemplate = formattedTemplates.find(t => t.isDefault);
        setSelectedTemplate(defaultTemplate || formattedTemplates[0]);
      }
    } catch (error: any) {
      console.error("Error fetching templates:", error.message);
      toast({
        title: "Error fetching templates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new template
  const createTemplate = async (templateData: {
    title: string;
    description: string;
    pillars: PromptPillar[];
    systemPrefix: string;
    maxChars: number;
    temperature: number;
  }) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create templates",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Convert pillars to JSON format for storage
      const pillarsJson = templatePillarsToJson(templateData.pillars);

      const { data, error } = await supabase
        .from('prompt_templates')
        .insert({
          title: templateData.title,
          description: templateData.description,
          system_prefix: templateData.systemPrefix,
          pillars: pillarsJson,
          is_default: false, // User created templates are never default
          max_chars: templateData.maxChars,
          temperature: templateData.temperature,
          user_id: userId
        })
        .select();

      if (error) {
        throw error;
      }

      // Get the newly created template
      if (data && data.length > 0) {
        const newTemplate: PromptTemplate = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          isDefault: data[0].is_default,
          pillars: jsonToPillars(data[0].pillars as Json),
          systemPrefix: data[0].system_prefix,
          maxChars: data[0].max_chars,
          temperature: data[0].temperature,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
          user_id: data[0].user_id
        };

        setTemplates(prev => [newTemplate, ...prev]);
        
        toast({
          title: "Template created",
          description: "Your new template has been created successfully",
        });
        
        return newTemplate;
      }
      return null;
    } catch (error: any) {
      console.error("Error creating template:", error.message);
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Update an existing template
  const updateTemplate = async (
    templateId: string,
    templateData: {
      title: string;
      description: string;
      pillars: PromptPillar[];
      systemPrefix: string;
      maxChars: number;
      temperature: number;
    }
  ) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update templates",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Convert pillars to JSON format for storage
      const pillarsJson = templatePillarsToJson(templateData.pillars);

      const { error } = await supabase
        .from('prompt_templates')
        .update({
          title: templateData.title,
          description: templateData.description,
          system_prefix: templateData.systemPrefix,
          pillars: pillarsJson,
          max_chars: templateData.maxChars,
          temperature: templateData.temperature
        })
        .eq('id', templateId)
        .eq('user_id', userId); // Ensure they own the template

      if (error) {
        throw error;
      }

      // Update the local state
      setTemplates(prev =>
        prev.map(template =>
          template.id === templateId
            ? {
                ...template,
                title: templateData.title,
                description: templateData.description,
                pillars: templateData.pillars,
                systemPrefix: templateData.systemPrefix,
                maxChars: templateData.maxChars,
                temperature: templateData.temperature
              }
            : template
        )
      );

      toast({
        title: "Template updated",
        description: "Your template has been updated successfully",
      });

      return true;
    } catch (error: any) {
      console.error("Error updating template:", error.message);
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete a template
  const deleteTemplate = async (templateId: string) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete templates",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId); // Ensure they own the template

      if (error) {
        throw error;
      }

      // Update the local state
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      
      // If the deleted template was selected, select another one
      if (selectedTemplate && selectedTemplate.id === templateId) {
        const firstTemplate = templates.find(t => t.id !== templateId);
        setSelectedTemplate(firstTemplate || null);
      }

      toast({
        title: "Template deleted",
        description: "Your template has been deleted successfully",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting template:", error.message);
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Fetch templates on component mount or when userId changes
  useEffect(() => {
    fetchTemplates();
  }, [userId]);

  return {
    templates,
    isLoading,
    selectedTemplate,
    setSelectedTemplate,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
};
