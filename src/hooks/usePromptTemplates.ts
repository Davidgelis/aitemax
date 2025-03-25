
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PromptTemplate, PillarConfig } from '@/components/dashboard/types';
import { Json } from '@/integrations/supabase/types';

export const usePromptTemplates = (userId: string | null) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchTemplates = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedTemplates: PromptTemplate[] = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          systemPrefix: item.system_prefix || '',
          pillars: Array.isArray(item.pillars) 
            ? item.pillars.map((p: any) => ({
                type: p.type || 'text',
                name: p.name || '',
                description: p.description || '',
                examples: p.examples || []
              }))
            : [],
          isDefault: item.is_default || false,
          maxChars: item.max_chars || 8000,
          temperature: item.temperature || 0.7,
          createdAt: item.created_at,
          updatedAt: item.updated_at || item.created_at
        }));
        
        setTemplates(formattedTemplates);
      }
    } catch (err: any) {
      console.error('Error fetching templates:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  const createTemplate = useCallback(async (template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;
    
    try {
      const formattedPillars = JSON.stringify(template.pillars);
      
      const { data, error } = await supabase
        .from('prompt_templates')
        .insert({
          title: template.title,
          description: template.description,
          system_prefix: template.systemPrefix,
          pillars: formattedPillars as unknown as Json,
          is_default: template.isDefault,
          max_chars: template.maxChars,
          temperature: template.temperature,
          user_id: userId
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const newTemplate: PromptTemplate = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description || '',
          systemPrefix: data[0].system_prefix || '',
          pillars: Array.isArray(data[0].pillars) 
            ? data[0].pillars.map((p: any) => ({
                type: p.type || 'text',
                name: p.name || '',
                description: p.description || '',
                examples: p.examples || []
              }))
            : [],
          isDefault: data[0].is_default || false,
          maxChars: data[0].max_chars || 8000,
          temperature: data[0].temperature || 0.7,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at || data[0].created_at
        };
        
        // If this is the default template, update localStorage
        if (newTemplate.isDefault) {
          localStorage.setItem('selectedTemplateId', newTemplate.id);
        }
        
        return newTemplate;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error creating template:', err.message);
      throw err;
    }
  }, [userId]);
  
  const updateTemplate = useCallback(async (
    id: string, 
    updates: Partial<Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!userId) return null;
    
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.systemPrefix !== undefined) updateData.system_prefix = updates.systemPrefix;
      if (updates.pillars !== undefined) updateData.pillars = JSON.stringify(updates.pillars) as unknown as Json;
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
      if (updates.maxChars !== undefined) updateData.max_chars = updates.maxChars;
      if (updates.temperature !== undefined) updateData.temperature = updates.temperature;
      
      const { data, error } = await supabase
        .from('prompt_templates')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const updatedTemplate: PromptTemplate = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description || '',
          systemPrefix: data[0].system_prefix || '',
          pillars: Array.isArray(data[0].pillars) 
            ? data[0].pillars.map((p: any) => ({
                type: p.type || 'text',
                name: p.name || '',
                description: p.description || '',
                examples: p.examples || []
              }))
            : [],
          isDefault: data[0].is_default || false,
          maxChars: data[0].max_chars || 8000,
          temperature: data[0].temperature || 0.7,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at
        };
        
        // If this is the default template, update localStorage
        if (updatedTemplate.isDefault) {
          localStorage.setItem('selectedTemplateId', updatedTemplate.id);
        }
        
        return updatedTemplate;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error updating template:', err.message);
      throw err;
    }
  }, [userId]);
  
  const deleteTemplate = useCallback(async (id: string) => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // If this was the selected template in localStorage, clear it
      const selectedTemplateId = localStorage.getItem('selectedTemplateId');
      if (selectedTemplateId === id) {
        localStorage.removeItem('selectedTemplateId');
      }
      
      return true;
    } catch (err: any) {
      console.error('Error deleting template:', err.message);
      return false;
    }
  }, [userId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
};
