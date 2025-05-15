
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";
import { PROTECTED_TEMPLATE_IDS } from "@/components/dashboard/constants";
import { templatePillarsMap } from "@/components/dashboard/templatePillars";

export interface PillarType {
  id: string;
  title: string;
  description: string;
}

export interface TemplateType {
  id: string;
  name: string;
  role: string;
  pillars: PillarType[];
  temperature: number;
  characterLimit?: number;
  isDefault?: boolean;
  createdAt: string;
}

export type TemplateSource = "system" | "user";

// ---- NEW: remember which system sub-template is chosen -------------
interface SystemState {
  subId: string | null        // e.g. "code-creation"
}

// Default template as fallback
const DEFAULT_TEMPLATE: TemplateType = {
  id: "default",
  name: "Aitema X Framework",
  role: "You are an expert prompt engineer...", // Shortened for brevity
  pillars: [
    {
      id: "1",
      title: "Task",
      description: "Purpose: Clearly communicate the main objective..."
    },
    {
      id: "2",
      title: "Persona",
      description: "Assume the role of an advanced scenario generator..."
    },
    {
      id: "3",
      title: "Conditions",
      description: "The purpose is to provide detailed guidelines..."
    },
    {
      id: "4",
      title: "Instructions",
      description: "Provide overarching guidance that unifies..."
    }
  ],
  temperature: 0.7,
  characterLimit: 5000,
  isDefault: true,
  createdAt: "System Default"
};

/* ------------------------------------------------------------------ */
/*  INTERNAL HOOK (was the old export)                                 */
/* ------------------------------------------------------------------ */
function useTemplateManagementInternal() {
  const [currentTemplate, setCurrentTemplate] = useState<TemplateType | null>(null);
  const [templates, setTemplates] = useState<TemplateType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSource, setLastSource] = useState<TemplateSource>("system");
  const [systemState, setSystemState] = useState<SystemState>({ subId: null });
  const { toast } = useToast();

  // Helper for deep template validation
  const validateTemplate = (template: any): boolean => {
    if (!template) return false;
    
    return (
      typeof template === 'object' &&
      typeof template.id === 'string' &&
      typeof template.name === 'string' &&
      Array.isArray(template.pillars) &&
      template.pillars.length > 0 &&
      template.pillars.every((p: any) => 
        p && 
        typeof p.id === 'string' &&
        typeof p.title === 'string' &&
        typeof p.description === 'string'
      ) &&
      typeof template.temperature === 'number'
    );
  };

  // Helper to create a deep copy of the template
  const deepCopyTemplate = (template: TemplateType): TemplateType => {
    try {
      return JSON.parse(JSON.stringify(template));
    } catch (error) {
      console.error("Failed to create deep copy of template:", error);
      // Return a shallow copy as fallback
      return { ...template, pillars: [...template.pillars] };
    }
  };

  // Fetch templates and set the current template
  useEffect(() => {
    const fetchAndSetTemplates = async () => {
      setIsLoading(true);
      
      try {
        // First check if there's a template ID in localStorage
        const storedTemplateId = window.localStorage.getItem('selectedTemplateId');
        
        // Try to get the template from the window object
        const windowTemplate = window.__selectedTemplate;
        let validWindowTemplate = validateTemplate(windowTemplate);
        
        // Fetch all templates from Supabase
        const { data: templateData, error: templatesError } = await supabase
          .from('x_templates')
          .select('*');
          
        if (templatesError) {
          console.error("Error fetching templates:", templatesError);
        } else if (templateData && templateData.length > 0) {
          // Convert database templates to TemplateType array
          const formattedTemplates: TemplateType[] = templateData.map(template => ({
            id: template.id,
            name: template.name,
            role: template.role,
            pillars: Array.isArray(template.pillars) ? (template.pillars as any[] as PillarType[]) : [],
            temperature: template.temperature,
            characterLimit: template.character_limit,
            isDefault: template.is_default,
            createdAt: new Date(template.created_at).toLocaleDateString()
          }));
          
          // Add default template if it doesn't exist
          if (!formattedTemplates.some(t => t.id === DEFAULT_TEMPLATE.id)) {
            formattedTemplates.unshift(DEFAULT_TEMPLATE);
          }
          
          setTemplates(formattedTemplates);
        } else {
          // If no templates found, use just the default template
          setTemplates([DEFAULT_TEMPLATE]);
        }
        
        // If window has a valid template and it matches the stored ID, use it
        if (validWindowTemplate && windowTemplate && windowTemplate.id === storedTemplateId) {
          setCurrentTemplate(deepCopyTemplate(windowTemplate));
          console.log("useTemplateManagement: Using template from window object:", windowTemplate.name);
        } 
        // Otherwise try to fetch the template from Supabase
        else if (storedTemplateId) {
          console.log(`useTemplateManagement: Fetching template with ID: ${storedTemplateId}`);
          
          // First check if it's a default template
          if (storedTemplateId === "default" || storedTemplateId === "simple-framework") {
            const defaultTemplate = DEFAULT_TEMPLATE;
            setCurrentTemplate(deepCopyTemplate(defaultTemplate));
            
            // Also update the window object
            window.__selectedTemplate = deepCopyTemplate(defaultTemplate);
            console.log("useTemplateManagement: Using default template:", defaultTemplate.name);
          } else {
            // Try to fetch from database
            const { data, error } = await supabase
              .from('x_templates')
              .select('*')
              .eq('id', storedTemplateId)
              .maybeSingle();
            
            if (error) {
              console.error("Error fetching template:", error);
              setCurrentTemplate(deepCopyTemplate(DEFAULT_TEMPLATE));
              toast({
                title: "Error loading template",
                description: "Falling back to default template",
                variant: "destructive"
              });
            } else if (data) {
              // Convert database format to TemplateType
              const template: TemplateType = {
                id: data.id,
                name: data.name,
                role: data.role,
                pillars: Array.isArray(data.pillars) ? (data.pillars as any[] as PillarType[]) : [],
                temperature: data.temperature,
                characterLimit: data.character_limit,
                isDefault: data.is_default,
                createdAt: new Date(data.created_at).toLocaleDateString()
              };
              
              setCurrentTemplate(template);
              
              // Update the window object
              window.__selectedTemplate = deepCopyTemplate(template);
              console.log("useTemplateManagement: Loaded template from database:", template.name);
            } else {
              // If no template found, use default
              setCurrentTemplate(deepCopyTemplate(DEFAULT_TEMPLATE));
              window.__selectedTemplate = deepCopyTemplate(DEFAULT_TEMPLATE);
              console.log("useTemplateManagement: No template found, using default");
            }
          }
        } else {
          // No stored template ID, use default
          setCurrentTemplate(deepCopyTemplate(DEFAULT_TEMPLATE));
          window.__selectedTemplate = deepCopyTemplate(DEFAULT_TEMPLATE);
          window.localStorage.setItem('selectedTemplateId', DEFAULT_TEMPLATE.id);
          console.log("useTemplateManagement: No stored template ID, using default");
        }
      } catch (error) {
        console.error("Error in fetchAndSetTemplates:", error);
        setCurrentTemplate(deepCopyTemplate(DEFAULT_TEMPLATE));
        toast({
          title: "Error loading template",
          description: "Falling back to default template",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAndSetTemplates();
  }, [toast]);
  
  /**
   * @param templateId   id of the *real* template to load (framework id or user id)
   * @param source       who triggered the change ("system" | "user")
   * @param subId        if source === "system" and user clicked a sub-category,
   *                     pass its id so we can show it on the button
   */
  const selectTemplate = async (
    templateId: string,
    source: TemplateSource = "system",
    subId: string | null = null
  ) => {
    try {
      console.log(`useTemplateManagement: Selecting template with ID: ${templateId}, source: ${source}, subId: ${subId}`);
      
      setLastSource(source);              // single source of truth
      setSystemState({ subId: source === "system" ? subId : null });
      
      // Store the selection in localStorage
      window.localStorage.setItem('selectedTemplateId', templateId);
      
      // If using a system subcategory template with specialized pillars
      if (source === "system" && subId && templatePillarsMap[subId]) {
        console.log(`Loading specialized pillars for subcategory: ${subId}`);
        const pillarConfig = templatePillarsMap[subId];
        
        // Build your specialized template off the DEFAULT but override id → subId
        const specializedTemplate: TemplateType = {
          id: subId,    // <— make sure the template.id is your sub-template ID!
          name: subId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          role:         pillarConfig.role   || DEFAULT_TEMPLATE.role,
          temperature:  pillarConfig.temperature || DEFAULT_TEMPLATE.temperature,
          characterLimit: DEFAULT_TEMPLATE.characterLimit,
          pillars:      pillarConfig.pillars,
          createdAt:    "System"
        };
        
        setCurrentTemplate(deepCopyTemplate(specializedTemplate));
        window.__selectedTemplate = deepCopyTemplate(specializedTemplate);
        
        // Before returning, explicitly override localStorage with subId
        window.localStorage.setItem('selectedTemplateId', subId);
        
        toast({
          title: "Template selected",
          description: `"${specializedTemplate.name}" template with specialized pillars has been applied.`
        });
        return;
      }
      
      // If it's a default template
      if (templateId === "default" || templateId === "simple-framework") {
        const defaultTemplate = DEFAULT_TEMPLATE;
        setCurrentTemplate(deepCopyTemplate(defaultTemplate));
        window.__selectedTemplate = deepCopyTemplate(defaultTemplate);
        
        toast({
          title: "Template selected",
          description: `"${defaultTemplate.name}" is now your default template.`
        });
        return;
      }
      
      // Fetch from database
      const { data, error } = await supabase
        .from('x_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Convert database format to TemplateType
        const template: TemplateType = {
          id: data.id,
          name: data.name,
          role: data.role,
          pillars: Array.isArray(data.pillars) ? (data.pillars as any[] as PillarType[]) : [],
          temperature: data.temperature,
          characterLimit: data.character_limit,
          isDefault: data.is_default,
          createdAt: new Date(data.created_at).toLocaleDateString()
        };
        
        setCurrentTemplate(deepCopyTemplate(template));
        
        // Update window object
        window.__selectedTemplate = deepCopyTemplate(template);
        
        toast({
          title: "Template selected",
          description: `"${template.name}" is now your default template.`
        });
      }
    } catch (error) {
      console.error("Error selecting template:", error);
      toast({
        title: "Error selecting template",
        description: "Failed to select template",
        variant: "destructive"
      });
    }
  };

  // Getter function for current template - always returns a valid template
  const getCurrentTemplate = (): TemplateType => {
    // If we have a loaded template, return it
    if (currentTemplate && validateTemplate(currentTemplate)) {
      return deepCopyTemplate(currentTemplate);
    }
    
    // Try from window as backup
    if (window.__selectedTemplate && validateTemplate(window.__selectedTemplate)) {
      return deepCopyTemplate(window.__selectedTemplate);
    }
    
    // Fall back to default template
    console.warn("getCurrentTemplate: Using fallback default template");
    return deepCopyTemplate(DEFAULT_TEMPLATE);
  };

  return {
    currentTemplate,
    templates,
    isLoading,
    selectTemplate,
    lastSource,
    systemState,          // <- expose it
    getCurrentTemplate,
    validateTemplate
  };
}

/* ------------------------------------------------------------------ */
/*  CONTEXT WIRING                                                     */
/* ------------------------------------------------------------------ */
const TemplateManagementContext = createContext<
  ReturnType<typeof useTemplateManagementInternal> | null
>(null);

export const TemplateManagementProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const value = useTemplateManagementInternal();
  return (
    <TemplateManagementContext.Provider value={value}>
      {children}
    </TemplateManagementContext.Provider>
  );
};

export function useTemplateManagement() {
  const ctx = useContext(TemplateManagementContext);
  if (!ctx) {
    throw new Error(
      "useTemplateManagement must be used inside <TemplateManagementProvider>"
    );
  }
  return ctx;
}
