import { useState, useEffect } from "react";
import { XTemplateCard, TemplateType } from "./XTemplateCard";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Json } from "@/integrations/supabase/types";

// Declare the global type
declare global {
  interface Window {
    __selectedTemplate?: TemplateType;
  }
}

// Default templates (this would come from an API in a real implementation)
const defaultTemplates: TemplateType[] = [
  {
    id: "default",
    name: "Aitema X Framework", // Updated name here
    role: "You are an expert prompt engineer who transforms input prompts or intents along with context infromation into highly effective, well-structured prompts in accordance with the four-pillar framework. You will be provided with intent and context information, which may be as brief as two sentences or as extensive as a comprehensive brief. Your role is to refine and enhance the given prompt while preserving its core objectives and style",
    pillars: [
      {
        id: "1",
        title: "Task",
        description: "Purpose: Clearly communicate the main objective: You are given an initial prompt that needs to be improved (clarity, grammar, structure, and flow) without losing the original intent. Specify the expected final output: a reformulated version of the prompt divided into the four pillars (Task, Persona, Conditions, and Instructions).\n\nBest Practices:\n- Conciseness & Clarity: Keep the directive succinct but unambiguous. Emphasize the transformation (from raw input to enhanced output) as the central goal.\n- Preservation of Intent: While refining grammar and structure, ensure the original meaning and purpose are not lost.\n- Consistency in Tone & Style: Maintain a neutral, professional style throughout, matching the formal brand voice."
      },
      {
        id: "2",
        title: "Persona",
        description: "Assume the role of an advanced scenario generator with expertise in language, prompt engineering, and multi-perspective analysis, tasked with generating a final multi-perspective prompt that produces multiple, distinct personas addressing a strategic question; use the following example roles—CFO (focused on cost management and risk mitigation), CTO (prioritizing innovation and technical feasibility), CMO (concentrating on brand perception and market impact), and HR Lead (responsible for talent development and organizational culture)—as scaffolding to guide the creation of varied personas rather than as the final output, ensuring that each persona is presented in a clearly labeled section using an executive tone with third-person pronouns and minimal contractions, and that they dynamically engage by addressing, challenging, or building upon one another's viewpoints, culminating in a concise summary that synthesizes consensus and highlights any open issues for further discussion."
      },
      {
        id: "3",
        title: "Conditions",
        description: "The purpose is to provide detailed guidelines on how to perform the correction and enhancement process, outlining the methodology with a focus on structure, syntax, and contextual awareness while clarifying actions for missing or ambiguous data. Best practices include organizing content logically for a clear flow, using specific formats or templates as required, and adhering to strict grammar rules to maintain stylistic consistency. Abstract examples should be used to illustrate concepts without unnecessary specifics, breaking content into related categories for readability, and ensuring cross-checking with multiple data points to avoid misclassification, along with mechanisms for re-evaluation when context conflicts arise. Additionally, it is important to assess the full meaning of statements—including slang, idioms, and cultural references—. Optionally, include a \"Notes\" section for extra clarifications, and ensure that for projects or historical events, information is presented in sequential or hierarchical order to respect dependencies and avoid omissions."
      },
      {
        id: "4",
        title: "Instructions",
        description: "Provide overarching guidance that unifies and applies the principles from the preceding pillars (Task, Persona, and Conditions) into a cohesive prompt-generation strategy. Outline how to interpret, prioritize, and synthesize the information each pillar contains—ensuring coherence and fidelity to the source intent—while maintaining a consistent, authoritative tone. Emphasize best practices in structure, clarity, style, and logic to create a final prompt that stays true to the original objectives. Whenever clarifications or revisions are necessary, include brief notes or recommendations for re-checking facts, adjusting style, or resolving ambiguities. By following these instructions, you will produce a streamlined, accurate, and contextually relevant multi-perspective prompt that effectively meets the aims set out by the other pillars."
      }
    ],
    temperature: 0.7,
    characterLimit: 5000,
    isDefault: true,
    createdAt: "System Default"
  },
  {
    id: "simple-framework",
    name: "Simple Four-Pillar Framework",
    role: "You are a prompt engineer that helps structure prompts with a four-pillar framework.",
    pillars: [
      {
        id: "1",
        title: "Task",
        description: "What needs to be done? Define the main objective or goal clearly."
      },
      {
        id: "2",
        title: "Persona",
        description: "Who should the AI be? Define the role and expertise needed."
      },
      {
        id: "3",
        title: "Conditions",
        description: "What are the key requirements or constraints?"
      },
      {
        id: "4",
        title: "Instructions",
        description: "What specific steps or guidelines should be followed?"
      }
    ],
    temperature: 0.7,
    characterLimit: 5000,
    createdAt: "Example Template"
  }
];

// Helper function to convert PillarType[] to Json for Supabase
const pillarsToJson = (pillars: PillarType[]): Json => {
  return pillars as unknown as Json;
};

// Helper function to convert Json from Supabase to PillarType[]
const jsonToPillars = (json: Json): PillarType[] => {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as PillarType[];
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

// Create a global event for template updates
export const addTemplate = async (template: TemplateType) => {
  try {
    // First, dispatch event for UI update
    if (!dispatchTemplateEvent('template-added', template)) {
      console.error("Failed to dispatch template-added event");
    }
    
    // Update the global selected template if this is the currently selected one
    const storedTemplateId = window.localStorage.getItem('selectedTemplateId');
    if (storedTemplateId === template.id) {
      window.__selectedTemplate = template;
      console.log("Updated window.__selectedTemplate with new template data:", template.name);
    }
    
    // Then, save to database if it's not a default template
    if (template.id !== "default" && template.id !== "simple-framework") {
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
        // Could add error toast here
      }
    }
  } catch (error) {
    console.error("Error in addTemplate:", error);
  }
};

// Create a global event for template deletion
export const deleteTemplate = async (templateId: string) => {
  try {
    // First, dispatch event for UI update
    if (!dispatchTemplateEvent('template-deleted', { id: templateId })) {
      console.error("Failed to dispatch template-deleted event");
    }
    
    // Then, delete from database if it's not a default template
    if (templateId !== "default" && templateId !== "simple-framework") {
      const { error } = await supabase.from('x_templates').delete().eq('id', templateId);
      
      if (error) {
        console.error("Error deleting template:", error);
        // Could add error toast here
      }
    }
  } catch (error) {
    console.error("Error in deleteTemplate:", error);
  }
};

export const XTemplatesList = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateType[]>(defaultTemplates);
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
          
          // Combine default templates with user templates
          setTemplates([...defaultTemplates, ...userTemplates]);
          
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
  
  // Separate effect to update the window.__selectedTemplate 
  // This ensures it's updated whenever selectedTemplateId changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        console.log("Setting window.__selectedTemplate to:", {
          id: template.id, 
          name: template.name,
          pillarsCount: template.pillars?.length || 0
        });
        
        // Create a deep copy to avoid reference issues
        try {
          const templateCopy = JSON.parse(JSON.stringify(template));
          window.__selectedTemplate = templateCopy;
          
          // Validate the template after setting
          const isValid = window.__selectedTemplate && 
                         window.__selectedTemplate.name && 
                         Array.isArray(window.__selectedTemplate.pillars);
                         
          console.log(`Template validation: ${isValid ? 'Valid' : 'Invalid'}`);
          
          // Store the ID in localStorage for persistence across refreshes
          window.localStorage.setItem('selectedTemplateId', selectedTemplateId);
        } catch (error) {
          console.error("Error copying template to window object:", error);
        }
      }
    }
  }, [selectedTemplateId, templates]);

  // Listen for template events
  useEffect(() => {
    const handleTemplateAdded = (event: CustomEvent<TemplateType>) => {
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
    };
    
    const handleTemplateDeleted = (event: CustomEvent<{id: string}>) => {
      setTemplates(prevTemplates => 
        prevTemplates.filter(t => t.id !== event.detail.id)
      );
      
      // If the deleted template was the selected one, revert to default
      if (selectedTemplateId === event.detail.id) {
        setSelectedTemplateId("default");
        window.localStorage.setItem('selectedTemplateId', "default");
        window.__selectedTemplate = templates.find(t => t.id === "default");
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
    
    // Save selectedTemplateId to localStorage for persistence
    window.localStorage.setItem('selectedTemplateId', id);
    
    // Update the selected template in the window object
    const template = templates.find(t => t.id === id);
    if (template) {
      try {
        // Create a deep copy to avoid reference issues
        const templateCopy = JSON.parse(JSON.stringify(template));
        window.__selectedTemplate = templateCopy;
        
        console.log("Updated window.__selectedTemplate:", {
          id: templateCopy.id,
          name: templateCopy.name,
          pillarsCount: templateCopy.pillars?.length || 0
        });
      } catch (error) {
        console.error("Error creating template copy:", error);
        window.__selectedTemplate = template; // Fallback to direct reference
      }
      
      toast({
        title: "Template selected",
        description: `"${template.name}" is now your default template.`
      });
    }
  };

  return (
    <div>
      {/* Disclaimer for users about the default template */}
      <div className="mb-6 p-4 bg-[#33fea6]/10 border border-[#33fea6]/30 rounded-md flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#33fea6] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm">
            <span className="font-medium">Recommendation:</span> We strongly recommend utilizing the default Aitema X Framework template, especially if you do not have advanced expertise in prompt engineering. This proven framework provides a clear, structured methodology designed specifically to enhance your prompt-writing capabilities, enabling you to generate more precise, impactful, and effective results.
          </p>
        </div>
      </div>
      
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
              <h3 className="text-xl font-medium mb-2">No templates found</h3>
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
