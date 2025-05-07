
import { useState, useEffect } from "react";
import { XTemplateCard, TemplateType, PillarType } from "./XTemplateCard";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Json } from "@/integrations/supabase/types";
import { useTemplateManagement } from "@/hooks/useTemplateManagement";
import { PROTECTED_TEMPLATE_IDS, defaultTemplates } from "@/components/dashboard/constants";

// Use the already declared Window interface in vite-env.d.ts
// instead of redeclaring it here

// Helper function to convert PillarType[] to Json for Supabase
const pillarsToJson = (pillars: PillarType[]): Json => {
  return pillars as unknown as Json;
};

// Helper function to convert Json from Supabase to PillarType[]
const jsonToPillars = (json: Json): PillarType[] => {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as PillarType[];
};

// Create a global event for template updates
export const addTemplate = async (template: TemplateType) => {
  try {
    // Dispatch event for UI update
    if (!dispatchTemplateEvent('template-added', template)) {
      console.error("Failed to dispatch template-added event");
    }
    
    // Update the global selected template if this is the currently selected one
    const storedTemplateId = window.localStorage.getItem('selectedTemplateId');
    if (storedTemplateId === template.id) {
      window.__selectedTemplate = template;
      console.log("Updated window.__selectedTemplate with new template data:", template.name);
    }
    
    // Save to database if not a default template
    if (!PROTECTED_TEMPLATE_IDS.includes(template.id)) {
      const { error } = await supabase.from('x_templates').upsert({
        id: template.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        name: template.name,
        role: template.role,
        pillars: pillarsToJson(template.pillars),
        temperature: template.temperature,
        character_limit: template.characterLimit,
        is_default: template.isDefault || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (error) {
        console.error("Error saving template:", error);
      }
    }
  } catch (error) {
    console.error("Error in addTemplate:", error);
  }
};

// Create a global event for template deletion
export const deleteTemplate = async (templateId: string) => {
  try {
    // Check if template is protected
    if (PROTECTED_TEMPLATE_IDS.includes(templateId)) {
      console.error("Cannot delete protected template");
      return;
    }

    // Dispatch event for UI update
    if (!dispatchTemplateEvent('template-deleted', { id: templateId })) {
      console.error("Failed to dispatch template-deleted event");
    }
    
    // Delete from database if not a default template
    const { error } = await supabase.from('x_templates').delete().eq('id', templateId);
    
    if (error) {
      console.error("Error deleting template:", error);
    }
  } catch (error) {
    console.error("Error in deleteTemplate:", error);
  }
};

// Custom event dispatching function with improved error handling
const dispatchTemplateEvent = (eventName: string, detail: any) => {
  try {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
    return true;
  } catch (error) {
    console.error(`Error dispatching ${eventName} event:`, error);
    return false;
  }
};

export const XTemplatesList = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectTemplate, getCurrentTemplate } = useTemplateManagement();
  const [templates, setTemplates] = useState<TemplateType[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('x_templates')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          console.error("Error fetching templates:", error);
          toast({
            title: "Error fetching templates",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data) {
          // Convert database templates to TemplateType format
          const userTemplates: TemplateType[] = data.map(item => ({
            id: item.id,
            name: item.name,
            role: item.role,
            pillars: jsonToPillars(item.pillars),
            temperature: item.temperature,
            characterLimit: item.character_limit,
            isDefault: item.is_default,
            createdAt: new Date(item.created_at).toLocaleDateString()
          }));
          
          // Only set user templates, not including default templates
          setTemplates(userTemplates);
          
          // Check if selectedTemplate is stored in localStorage
          const storedTemplateId = window.localStorage.getItem('selectedTemplateId');
          if (storedTemplateId) {
            setSelectedTemplateId(storedTemplateId);
          }
        }
      } catch (error) {
        console.error("Error in fetchTemplates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
    
  }, [user, toast]);
  
  // Listen for template events
  useEffect(() => {
    const handleTemplateAdded = (event: CustomEvent<TemplateType>) => {
      // Only add non-default templates
      if (!PROTECTED_TEMPLATE_IDS.includes(event.detail.id) && !event.detail.isDefault) {
        setTemplates(prevTemplates => {
          // Check if template with this ID already exists
          const exists = prevTemplates.some(t => t.id === event.detail.id);
          if (exists) {
            // Update existing template
            return prevTemplates.map(t => 
              t.id === event.detail.id ? event.detail : t
            );
          }
          // Add new template
          return [...prevTemplates, event.detail];
        });
      }
    };
    
    const handleTemplateDeleted = (event: CustomEvent<{id: string}>) => {
      setTemplates(prevTemplates => 
        prevTemplates.filter(t => t.id !== event.detail.id)
      );
      
      // If the deleted template was the selected one, revert to default
      if (selectedTemplateId === event.detail.id) {
        setSelectedTemplateId("default");
        window.localStorage.setItem('selectedTemplateId', "default");
      }
    };

    window.addEventListener('template-added', handleTemplateAdded as EventListener);
    window.addEventListener('template-deleted', handleTemplateDeleted as EventListener);
    
    return () => {
      window.removeEventListener('template-added', handleTemplateAdded as EventListener);
      window.removeEventListener('template-deleted', handleTemplateDeleted as EventListener);
    };
  }, [templates, selectedTemplateId]);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    
    // Use our template management hook to handle template selection
    selectTemplate(id);
  };

  return (
    <div>
      {/* Remove the disclaimer about default templates since we're not showing them anymore */}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <XTemplateCard
              key={template.id}
              template={template}
              isSelected={template.id === selectedTemplateId}
              onSelect={handleSelectTemplate}
            />
          ))}
          
          {templates.length === 0 && (
            <div className="col-span-3 text-center py-12">
              <h3 className="text-xl font-medium mb-2">No custom templates found</h3>
              <p className="text-muted-foreground mb-6">
                Create your first template to get started.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
