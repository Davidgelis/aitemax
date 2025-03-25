
import { useState, useEffect } from "react";
import { PromptTemplate } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const usePromptTemplates = (userId: string | undefined) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all templates (default system ones and user-created ones)
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      
      // Get templates - both default ones and user-created ones
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .or(`is_default.eq.true,user_id.eq.${userId}`)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match our type definition
      const formattedTemplates: PromptTemplate[] = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || "",
        systemPrefix: item.system_prefix || "",
        pillars: Array.isArray(item.pillars) ? item.pillars : [],
        isDefault: item.is_default,
        maxChars: item.max_chars || 4000,
        temperature: item.temperature || 0.7,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setTemplates(formattedTemplates);
      
      // If no template selected yet, choose the first default one
      if (!selectedTemplateId && formattedTemplates.length > 0) {
        const defaultTemplate = formattedTemplates.find(t => t.isDefault);
        setSelectedTemplateId(defaultTemplate?.id || formattedTemplates[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching templates:", error.message);
      toast({
        title: "Error loading templates",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new template
  const createTemplate = async (template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create templates",
          variant: "destructive"
        });
        return null;
      }

      const templateData = {
        title: template.title,
        description: template.description || "",
        system_prefix: template.systemPrefix,
        pillars: template.pillars,
        is_default: false, // User cannot create default templates
        max_chars: template.maxChars || 4000,
        temperature: template.temperature || 0.7,
        user_id: userId
      };

      const { data, error } = await supabase
        .from('prompt_templates')
        .insert(templateData)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newTemplate: PromptTemplate = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description || "",
          systemPrefix: data[0].system_prefix || "",
          pillars: data[0].pillars || [],
          isDefault: data[0].is_default,
          maxChars: data[0].max_chars,
          temperature: data[0].temperature,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at
        };

        setTemplates(prev => [newTemplate, ...prev]);
        toast({
          title: "Success",
          description: "Template created successfully"
        });
        
        return newTemplate;
      }
      return null;
    } catch (error: any) {
      console.error("Error creating template:", error.message);
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  // Update an existing template
  const updateTemplate = async (id: string, updates: Partial<Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      // First check if the template belongs to the user
      const { data: templateData, error: templateError } = await supabase
        .from('prompt_templates')
        .select('user_id, is_default')
        .eq('id', id)
        .single();

      if (templateError) throw templateError;

      // Prevent editing default templates or templates from other users
      if (templateData.is_default || (templateData.user_id !== userId)) {
        toast({
          title: "Cannot edit this template",
          description: "You can only edit your own custom templates",
          variant: "destructive"
        });
        return false;
      }

      // Format updates for Supabase
      const updateData: Record<string, any> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.systemPrefix !== undefined) updateData.system_prefix = updates.systemPrefix;
      if (updates.pillars !== undefined) updateData.pillars = updates.pillars;
      if (updates.maxChars !== undefined) updateData.max_chars = updates.maxChars;
      if (updates.temperature !== undefined) updateData.temperature = updates.temperature;

      const { error } = await supabase
        .from('prompt_templates')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setTemplates(prev => prev.map(template => 
        template.id === id 
          ? { ...template, ...updates, updatedAt: new Date().toISOString() } 
          : template
      ));

      toast({
        title: "Success",
        description: "Template updated successfully"
      });
      
      return true;
    } catch (error: any) {
      console.error("Error updating template:", error.message);
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Delete a template
  const deleteTemplate = async (id: string) => {
    try {
      // First check if the template belongs to the user
      const { data: templateData, error: templateError } = await supabase
        .from('prompt_templates')
        .select('user_id, is_default')
        .eq('id', id)
        .single();

      if (templateError) throw templateError;

      // Prevent deleting default templates or templates from other users
      if (templateData.is_default || (templateData.user_id !== userId)) {
        toast({
          title: "Cannot delete this template",
          description: "You can only delete your own custom templates",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setTemplates(prev => prev.filter(template => template.id !== id));
      
      // If the deleted template was selected, select another one
      if (selectedTemplateId === id) {
        const firstAvailable = templates.find(t => t.id !== id);
        setSelectedTemplateId(firstAvailable?.id || null);
      }

      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
      
      return true;
    } catch (error: any) {
      console.error("Error deleting template:", error.message);
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Duplicate a template
  const duplicateTemplate = async (id: string) => {
    try {
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to duplicate templates",
          variant: "destructive"
        });
        return null;
      }

      // Get the template to duplicate
      const templateToDuplicate = templates.find(t => t.id === id);
      if (!templateToDuplicate) {
        toast({
          title: "Template not found",
          description: "The template you are trying to duplicate could not be found",
          variant: "destructive"
        });
        return null;
      }

      // Create a new template based on the existing one
      return createTemplate({
        title: `${templateToDuplicate.title} (Copy)`,
        description: templateToDuplicate.description,
        systemPrefix: templateToDuplicate.systemPrefix,
        pillars: templateToDuplicate.pillars,
        isDefault: false, // User template
        maxChars: templateToDuplicate.maxChars,
        temperature: templateToDuplicate.temperature
      });
    } catch (error: any) {
      console.error("Error duplicating template:", error.message);
      toast({
        title: "Error duplicating template",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  // Get the currently selected template
  const getSelectedTemplate = () => {
    return templates.find(t => t.id === selectedTemplateId) || null;
  };

  // Load templates when component mounts or user changes
  useEffect(() => {
    if (userId || templates.length === 0) {
      fetchTemplates();
    }
  }, [userId]);

  return {
    templates,
    isLoading,
    selectedTemplateId,
    setSelectedTemplateId,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    getSelectedTemplate
  };
};
