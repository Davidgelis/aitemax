import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export const usePromptDrafts = (user: any) => {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabaseClient = supabase;

  const fetchDrafts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('prompt_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error fetching drafts:", error);
        throw error;
      }

      setDrafts(data || []);
    } catch (error) {
      console.error("Error in fetchDrafts:", error);
      toast({
        title: "Error fetching drafts",
        description: "There was a problem fetching your drafts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDraft = async (draftData: any) => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const draftId = draftData.id || crypto.randomUUID();
      
      // Convert variables to format suitable for storage
      const variables = draftData.variables ? 
        (draftData.variables as unknown as Json) : 
        null;
      
      const { error } = await supabaseClient
        .from('prompt_drafts')
        .upsert({
          id: draftId,
          user_id: user.id,
          title: draftData.title || "Untitled Draft",
          prompt_text: draftData.promptText || "",
          current_step: draftData.currentStep || 1,
          primary_toggle: draftData.primaryToggle || null,
          secondary_toggle: draftData.secondaryToggle || null,
          master_command: draftData.masterCommand || "",
          variables: variables,
          is_private: draftData.isPrivate !== undefined ? draftData.isPrivate : true,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("Error creating draft:", error);
        throw error;
      }
      
      // Fetch the newly created draft to return
      const { data: newDraft } = await supabaseClient
        .from('prompt_drafts')
        .select('*')
        .eq('id', draftId)
        .single();
      
      // Update local state
      fetchDrafts();
      
      return { ...newDraft, id: draftId };
      
    } catch (error) {
      console.error("Error in createDraft:", error);
      toast({
        title: "Error saving draft",
        description: "There was a problem saving your draft. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabaseClient
        .from('prompt_drafts')
        .delete()
        .eq('id', draftId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error deleting draft:", error);
        throw error;
      }

      // Update local state
      fetchDrafts();
    } catch (error) {
      console.error("Error in deleteDraft:", error);
      toast({
        title: "Error deleting draft",
        description: "There was a problem deleting your draft. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    drafts,
    isLoading,
    fetchDrafts,
    createDraft,
    deleteDraft
  };
};
