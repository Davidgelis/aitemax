
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PromptTemplate, PromptPillar, jsonToPillars } from '@/components/dashboard/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export const usePromptTemplates = (userId?: string) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const DEFAULT_TEMPLATE: PromptTemplate = {
    id: 'default',
    title: 'Aitema X Framework',
    description: 'The default four-pillar framework for prompt engineering',
    isDefault: true,
    pillars: [
      { id: uuidv4(), name: 'Task', content: '', order: 0, isEditable: true },
      { id: uuidv4(), name: 'Persona', content: '', order: 1, isEditable: true },
      { id: uuidv4(), name: 'Conditions', content: '', order: 2, isEditable: true },
      { id: uuidv4(), name: 'Instructions', content: '', order: 3, isEditable: true }
    ],
    systemPrefix: 'You are an expert prompt engineer that transforms input prompts into highly effective, well-structured prompts following the four-pillar framework.',
    maxChars: 4000,
    temperature: 0.7,
  };

  // Fetch all templates including default ones and user created ones
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      // First, add the default template
      const allTemplates: PromptTemplate[] = [DEFAULT_TEMPLATE];
      
      // Only fetch user templates if we have a user ID
      if (userId) {
        const { data, error } = await supabase
          .from('prompt_templates')
          .select('*')
          .or(`user_id.eq.${userId},is_default.eq.true`);
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          const userTemplates = data.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description || undefined,
            isDefault: item.is_default,
            pillars: jsonToPillars(item.pillars),
            systemPrefix: item.system_prefix || undefined,
            maxChars: item.max_chars || 4000,
            temperature: item.temperature || 0.7,
            created_at: item.created_at,
            updated_at: item.updated_at,
            user_id: item.user_id
          }));
          
          // Combine with default template, avoiding duplicates
          const uniqueTemplates = [...userTemplates];
          allTemplates.push(...uniqueTemplates);
        }
      }
      
      setTemplates(allTemplates);
      
      // If no template is selected yet, select the default one
      if (!selectedTemplate) {
        setSelectedTemplate(allTemplates[0]);
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error.message);
      toast({
        title: "Error fetching templates",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new template
  const createTemplate = async (template: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!userId) {
      toast({
        title: "Cannot create template",
        description: "You must be logged in to create templates",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      const newTemplate = {
        title: template.title,
        description: template.description || null,
        is_default: false, // User-created templates are never default
        pillars: template.pillars,
        system_prefix: template.systemPrefix || null,
        max_chars: template.maxChars || 4000,
        temperature: template.temperature || 0.7,
        user_id: userId
      };
      
      const { data, error } = await supabase
        .from('prompt_templates')
        .insert(newTemplate)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const createdTemplate: PromptTemplate = {
          id: data.id,
          title: data.title,
          description: data.description || undefined,
          isDefault: data.is_default,
          pillars: jsonToPillars(data.pillars),
          systemPrefix: data.system_prefix || undefined,
          maxChars: data.max_chars || 4000,
          temperature: data.temperature || 0.7,
          created_at: data.created_at,
          updated_at: data.updated_at,
          user_id: data.user_id
        };
        
        setTemplates(prev => [...prev, createdTemplate]);
        toast({
          title: "Template created",
          description: `Template "${createdTemplate.title}" has been created successfully`,
        });
        
        return createdTemplate;
      }
    } catch (error: any) {
      console.error('Error creating template:', error.message);
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive"
      });
    }
    
    return null;
  };

  // Update an existing template
  const updateTemplate = async (template: PromptTemplate) => {
    if (!userId || !template.id) {
      toast({
        title: "Cannot update template",
        description: "Invalid template or user information",
        variant: "destructive"
      });
      return false;
    }
    
    // Cannot update default template
    if (template.isDefault) {
      toast({
        title: "Cannot update template",
        description: "Default templates cannot be modified",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const updateData = {
        title: template.title,
        description: template.description || null,
        pillars: template.pillars,
        system_prefix: template.systemPrefix || null,
        max_chars: template.maxChars || 4000,
        temperature: template.temperature || 0.7,
      };
      
      const { error } = await supabase
        .from('prompt_templates')
        .update(updateData)
        .eq('id', template.id)
        .eq('user_id', userId); // Ensure user can only update their own templates
      
      if (error) {
        throw error;
      }
      
      // Update the template in state
      setTemplates(prev => 
        prev.map(t => t.id === template.id ? template : t)
      );
      
      // Update selected template if it's the one we just updated
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(template);
      }
      
      toast({
        title: "Template updated",
        description: `Template "${template.title}" has been updated successfully`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Error updating template:', error.message);
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Delete a template
  const deleteTemplate = async (templateId: string) => {
    if (!userId || !templateId) {
      toast({
        title: "Cannot delete template",
        description: "Invalid template or user information",
        variant: "destructive"
      });
      return false;
    }
    
    // Find the template to check if it's default
    const templateToDelete = templates.find(t => t.id === templateId);
    if (!templateToDelete) {
      toast({
        title: "Cannot delete template",
        description: "Template not found",
        variant: "destructive"
      });
      return false;
    }
    
    // Cannot delete default template
    if (templateToDelete.isDefault) {
      toast({
        title: "Cannot delete template",
        description: "Default templates cannot be deleted",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId); // Ensure user can only delete their own templates
      
      if (error) {
        throw error;
      }
      
      // Remove the template from state
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      // If the deleted template was selected, select the default template
      if (selectedTemplate?.id === templateId) {
        const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
        setSelectedTemplate(defaultTemplate);
      }
      
      toast({
        title: "Template deleted",
        description: `Template "${templateToDelete.title}" has been deleted successfully`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting template:', error.message);
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Set a template as default (for user's preference)
  const setDefaultTemplate = async (templateId: string) => {
    const newSelectedTemplate = templates.find(t => t.id === templateId);
    if (newSelectedTemplate) {
      setSelectedTemplate(newSelectedTemplate);
      
      // Store the user's preference in localStorage
      try {
        localStorage.setItem('defaultTemplateId', templateId);
      } catch (e) {
        console.error('Error saving default template to localStorage:', e);
      }
      
      return true;
    }
    return false;
  };

  // Initialize by loading templates and checking for stored preference
  useEffect(() => {
    fetchTemplates();
    
    // Try to load user's preferred template from localStorage
    try {
      const savedTemplateId = localStorage.getItem('defaultTemplateId');
      if (savedTemplateId) {
        // We'll set this after templates are loaded
        const preferredTemplate = templates.find(t => t.id === savedTemplateId);
        if (preferredTemplate) {
          setSelectedTemplate(preferredTemplate);
        }
      }
    } catch (e) {
      console.error('Error loading default template from localStorage:', e);
    }
  }, [userId]);

  return {
    templates,
    selectedTemplate,
    isLoading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setSelectedTemplate: setDefaultTemplate
  };
};

