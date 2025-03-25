
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PromptTemplatePillar {
  name: string;
  description: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string | null;
  user_id: string | null;
  pillars: PromptTemplatePillar[];
  is_default: boolean;
  system_prefix: string | null;
  max_chars: number;
  temperature: number;
  created_at: string;
  updated_at: string;
}

export function usePromptTemplates(user: any) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      
      // Get the auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Call our edge function to get templates
      const { data, error } = await supabase.functions.invoke('get-prompt-templates', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (error) {
        throw error;
      }

      if (data && data.templates) {
        setTemplates(data.templates);
        
        // Select the default template (first one from the list)
        if (data.templates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(data.templates[0]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error fetching templates",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (template: Partial<PromptTemplate>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create templates",
        variant: "destructive"
      });
      return null;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('prompt_templates')
        .insert({
          ...template,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Template created",
        description: "Your template has been created successfully"
      });

      // Refresh the templates list
      await fetchTemplates();
      
      return data;
    } catch (error: any) {
      console.error("Error creating template:", error);
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = async (id: string, updates: Partial<PromptTemplate>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update templates",
        variant: "destructive"
      });
      return null;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('prompt_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own templates
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Template updated",
        description: "Your template has been updated successfully"
      });

      // Refresh the templates list
      await fetchTemplates();
      
      return data;
    } catch (error: any) {
      console.error("Error updating template:", error);
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete templates",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only delete their own templates
        .eq('is_default', false); // Ensure user can't delete default templates

      if (error) {
        throw error;
      }

      toast({
        title: "Template deleted",
        description: "Your template has been deleted successfully"
      });

      // Refresh the templates list
      await fetchTemplates();
      
      return true;
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const enhancePromptWithTemplate = async (
    originalPrompt: string,
    answeredQuestions: any[],
    templateId: string = selectedTemplate?.id || ""
  ) => {
    try {
      setIsLoading(true);
      
      // Get the auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userId = user?.id;
      
      // Call our edge function to enhance the prompt using the selected template
      const { data, error } = await supabase.functions.invoke('use-prompt-template', {
        body: {
          originalPrompt,
          answeredQuestions,
          templateId,
          userId
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error enhancing prompt:", error);
      toast({
        title: "Error enhancing prompt",
        description: error.message,
        variant: "destructive"
      });
      return {
        enhancedPrompt: originalPrompt,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Load templates when user changes
  useEffect(() => {
    if (user) {
      fetchTemplates();
    } else {
      // Still fetch templates to get the default ones even when not logged in
      fetchTemplates();
    }
  }, [user]);

  return {
    templates,
    selectedTemplate,
    setSelectedTemplate,
    isLoading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    enhancePromptWithTemplate
  };
}
