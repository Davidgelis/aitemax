
import { supabase } from '@/integrations/supabase/client';
import { SavedPrompt, variablesToJson, jsonToVariables } from '@/components/dashboard/types';
import { v4 as uuidv4 } from 'uuid';

export class PromptService {
  static async getPrompts(userId: string | undefined): Promise<SavedPrompt[]> {
    if (!userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data.map((prompt: any) => ({
        id: prompt.id,
        title: prompt.title || 'Untitled Prompt',
        date: new Date(prompt.created_at).toLocaleDateString(),
        promptText: prompt.prompt_text || '',
        primaryToggle: prompt.primary_toggle,
        secondaryToggle: prompt.secondary_toggle,
        masterCommand: prompt.master_command || '',
        variables: prompt.variables ? jsonToVariables(prompt.variables) : [],
        jsonStructure: prompt.json_structure || null,
        isPrivate: prompt.is_private || false
      }));
    } catch (error) {
      console.error('Error fetching prompts:', error);
      return [];
    }
  }
  
  static async getPromptById(promptId: string): Promise<SavedPrompt | null> {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();
        
      if (error) throw error;
      
      if (!data) return null;
      
      return {
        id: data.id,
        title: data.title || 'Untitled Prompt',
        date: new Date(data.created_at).toLocaleDateString(),
        promptText: data.prompt_text || '',
        primaryToggle: data.primary_toggle,
        secondaryToggle: data.secondary_toggle,
        masterCommand: data.master_command || '',
        variables: data.variables ? jsonToVariables(data.variables) : [],
        jsonStructure: data.json_structure || null,
        isPrivate: data.is_private || false
      };
    } catch (error) {
      console.error('Error fetching prompt by ID:', error);
      return null;
    }
  }
  
  static async savePrompt(promptData: {
    promptText: string;
    masterCommand: string;
    variables: any[];
    primaryToggle: string | null;
    secondaryToggle: string | null;
    userId: string;
    isPrivate: boolean;
    jsonStructure?: any;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .insert({
          prompt_text: promptData.promptText,
          master_command: promptData.masterCommand,
          variables: variablesToJson(promptData.variables),
          primary_toggle: promptData.primaryToggle,
          secondary_toggle: promptData.secondaryToggle,
          user_id: promptData.userId,
          json_structure: promptData.jsonStructure || null,
          is_private: promptData.isPrivate
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data?.id || null;
    } catch (error) {
      console.error('Error saving prompt:', error);
      return null;
    }
  }
  
  static async deletePrompt(promptId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting prompt:', error);
      return false;
    }
  }
  
  static async duplicatePrompt(prompt: SavedPrompt): Promise<SavedPrompt> {
    try {
      const newPromptData = {
        prompt_text: prompt.promptText,
        title: `${prompt.title} (Copy)`,
        master_command: prompt.masterCommand || '',
        variables: variablesToJson(prompt.variables),
        primary_toggle: prompt.primaryToggle,
        secondary_toggle: prompt.secondaryToggle,
        user_id: (await supabase.auth.getSession()).data.session?.user.id,
        json_structure: prompt.jsonStructure || null,
        is_private: prompt.isPrivate || false
      };
      
      const { data, error } = await supabase
        .from('prompts')
        .insert(newPromptData)
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        date: new Date(data.created_at).toLocaleDateString(),
        promptText: data.prompt_text,
        primaryToggle: data.primary_toggle,
        secondaryToggle: data.secondary_toggle,
        masterCommand: data.master_command || '',
        variables: data.variables ? jsonToVariables(data.variables) : [],
        jsonStructure: data.json_structure || null,
        isPrivate: data.is_private || false
      };
    } catch (error) {
      console.error('Error duplicating prompt:', error);
      throw error;
    }
  }
  
  static async renamePrompt(promptId: string, newTitle: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prompts')
        .update({ title: newTitle })
        .eq('id', promptId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error renaming prompt:', error);
      return false;
    }
  }

  static async getDrafts(userId: string | undefined): Promise<SavedPrompt[]> {
    if (!userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('prompt_drafts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      return data.map((draft: any) => ({
        id: draft.id,
        title: draft.title || 'Untitled Draft',
        date: new Date(draft.updated_at).toLocaleDateString(),
        promptText: draft.prompt_text || '',
        primaryToggle: draft.primary_toggle,
        secondaryToggle: draft.secondary_toggle,
        masterCommand: draft.master_command || '',
        variables: draft.variables ? jsonToVariables(draft.variables) : [],
        isPrivate: draft.is_private || false
      }));
    } catch (error) {
      console.error('Error fetching drafts:', error);
      return [];
    }
  }
  
  static async getDraftById(draftId: string): Promise<SavedPrompt | null> {
    try {
      const { data, error } = await supabase
        .from('prompt_drafts')
        .select('*')
        .eq('id', draftId)
        .single();
        
      if (error) throw error;
      
      if (!data) return null;
      
      return {
        id: data.id,
        title: data.title || 'Untitled Draft',
        date: new Date(data.updated_at).toLocaleDateString(),
        promptText: data.prompt_text || '',
        primaryToggle: data.primary_toggle,
        secondaryToggle: data.secondary_toggle,
        masterCommand: data.master_command || '',
        variables: data.variables ? jsonToVariables(data.variables) : [],
        isPrivate: data.is_private || false
      };
    } catch (error) {
      console.error('Error fetching draft by ID:', error);
      return null;
    }
  }

  static async saveDraftPrompt(draftData: {
    promptText: string;
    masterCommand: string;
    variables: any[];
    primaryToggle: string | null;
    secondaryToggle: string | null;
    userId: string | undefined;
    isPrivate: boolean;
  }): Promise<boolean> {
    try {
      if (!draftData.userId) return false;
      
      // Create a title from the first line of the prompt
      const title = draftData.promptText.split('\n')[0] || 'Untitled Draft';
      
      const { error } = await supabase
        .from('prompt_drafts')
        .insert({
          prompt_text: draftData.promptText,
          title: title,
          master_command: draftData.masterCommand,
          variables: variablesToJson(draftData.variables),
          primary_toggle: draftData.primaryToggle,
          secondary_toggle: draftData.secondaryToggle,
          user_id: draftData.userId,
          is_private: draftData.isPrivate
        });
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error saving draft prompt:', error);
      return false;
    }
  }
  
  static async deleteDraft(draftId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prompt_drafts')
        .delete()
        .eq('id', draftId);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      return false;
    }
  }
}
