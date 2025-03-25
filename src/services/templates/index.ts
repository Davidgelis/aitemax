
import { supabase } from "@/integrations/supabase/client";
import { PromptTemplate, PromptPillar } from "@/components/dashboard/types";
import { Json } from "@/integrations/supabase/types";

// Helper function to convert database response to our frontend types
const dbToPromptTemplate = (item: any): PromptTemplate => {
  return {
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    pillars: Array.isArray(item.pillars) ? item.pillars : [],
    isDefault: item.is_default,
    maxChars: item.max_chars,
    temperature: item.temperature,
    systemPrefix: item.system_prefix,
    userId: item.user_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
};

export const fetchTemplates = async (): Promise<PromptTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data.map(dbToPromptTemplate);
  } catch (error) {
    console.error('Error fetching prompt templates:', error);
    throw error;
  }
};

export const createTemplate = async (template: Partial<PromptTemplate>): Promise<PromptTemplate> => {
  try {
    const { data, error } = await supabase
      .from('prompt_templates')
      .insert({
        title: template.title,
        description: template.description,
        pillars: template.pillars as unknown as Json,
        is_default: false, // Users can't create default templates
        max_chars: template.maxChars,
        temperature: template.temperature,
        system_prefix: template.systemPrefix,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    return dbToPromptTemplate(data);
  } catch (error) {
    console.error('Error creating prompt template:', error);
    throw error;
  }
};

export const updateTemplate = async (id: string, template: Partial<PromptTemplate>): Promise<PromptTemplate> => {
  try {
    const { data, error } = await supabase
      .from('prompt_templates')
      .update({
        title: template.title,
        description: template.description,
        pillars: template.pillars as unknown as Json,
        max_chars: template.maxChars,
        temperature: template.temperature,
        system_prefix: template.systemPrefix,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    return dbToPromptTemplate(data);
  } catch (error) {
    console.error('Error updating prompt template:', error);
    throw error;
  }
};

export const deleteTemplate = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting prompt template:', error);
    throw error;
  }
};
