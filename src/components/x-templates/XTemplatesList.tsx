
import { useState, useEffect } from "react";
import { XTemplateCard, TemplateType } from "./XTemplateCard";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Json } from "@/integrations/supabase/types";

// Default templates (this would come from an API in a real implementation)
const defaultTemplates: TemplateType[] = [
  {
    id: "default",
    name: "Four-Pillar Framework",
    role: "You are an expert prompt engineer that transforms input prompts into highly effective, well-structured prompts following the four-pillar framework.",
    pillars: [
      {
        id: "1",
        title: "Task",
        description: "You will be provided with an intent and context information, which may be as brief as two sentences or as extensive as a comprehensive brief. Your job is to enhance this prompt by applying best practices and instructions."
      },
      {
        id: "2",
        title: "Persona",
        description: "Assume the role of an advanced scenario generator with deep expertise in language, prompt engineering, and multi-perspective analysis. You will simulate multiple well-established personas in a professional corporate setting, each with a unique focus and viewpoint.\n\nRole:\n\nCFO: Concentrates on cost management and risk mitigation.\n\nCTO: Prioritizes innovation and technical feasibility.\n\nCMO: Focuses on brand perception and market impact.\n\nHR Lead: Ensures talent development and organizational culture.\n\nFor each persona's section:\n\nUse third-person pronouns and minimal contractions while maintaining a formal executive style.\n\nPresent clear headings for each persona.\n\nOffer counterpoints or new ideas that build upon the concerns and suggestions of others.\n\nConclude with a concise, holistic summary highlighting consensus and any open issues for further discussion.\n\nEnsure that the style is consistent and that each perspective is logically grounded and coherent."
      },
      {
        id: "3",
        title: "Conditions",
        description: "When correcting and enhancing the prompt, adhere to these comprehensive guidelines to ensure accuracy, clarity, and a consistent structure.\n\nApproach:\n\nStructure-Oriented: Maintain a clear layout and logical flow of information.\n\nSyntax-Focused: Emphasize specific formats or templates to shape the response.\n\nAbstract Examples: Use generalized illustrations to explain structure without delving into unnecessary detail.\n\nCategorical Approach: Organize all content logically, ensuring coherence.\n\nElements:\n\nCross-Checking with Multiple Data Points\n\nValidate outputs against multiple references or logical checks.\n\nInclude a re-evaluation mechanism if an initial classification seems correct yet contradicts underlying data.\n\nContext Awareness & Contradictions\n\nInterpret the full meaning of statements, accounting for slang, idioms, and cultural variations.\n\nRecognizing Pattern-Based Biases\n\nAvoid oversimplified rules or common patterns that could cause misclassification.\n\nConsider edge cases before applying general guidelines.\n\nHighlighting Incomplete Information\n\nClearly label missing or ambiguous data as \"[Context Needed]\" if context is lacking.\n\nDefinitive Data Identification\n\nMark data known to be universally true and ensure it remains unchanged.\n\nTerminology & Definitions\n\nDefine ambiguous terms to prevent misinterpretation or misuse.\n\nSample Output Requirement\n\nIf a sample ideal \"MPPoutput\" is provided or needed, include it in the final prompt.\n\nNotes for Extra Clarifications\n\nAppend a \"Notes\" section at the end for additional clarifications, commentaries, or examples.\n\nTimeline and Hierarchy Considerations\n\nFor project or historical timelines, list events chronologically or hierarchically, respecting dependencies.\n\nProvide short recaps for each segment or break long timelines into manageable sections."
      },
      {
        id: "4",
        title: "Instructions",
        description: "Follow these step-by-step guidelines to correct and enhance the given input. Always ensure the final output is a complete, standalone prompt with the four-pillar structure (Task, Persona, Conditions, Instructions).\n\nProcess:\n\nOutline the Approach\n\nDescribe your methodology for analyzing and refining the input.\n\nAnalyze the Input\n\nIdentify key objectives, intentions, and areas requiring improvement.\n\nAdjust your enhancement process based on whether the input is minimal or detailed.\n\nSynthesize and Organize\n\nMerge your findings into a coherent, revised prompt.\n\nConfirm that the final version contains all crucial details, organized under the four pillars.\n\nFinalize the Corrected Prompt\n\nPresent a complete, standalone prompt that can generate high-quality, contextually rich responses.\n\nInsert \"[Context Needed]\" placeholders for missing information.\n\nInclude a Notes Section\n\nAdd a \"Notes\" segment at the end for extra clarifications, examples, or commentaries.\n\nFinal Review\n\nConduct a thorough review to ensure clarity, specificity, and accuracy.\n\nMake only necessary enhancements to address weaknesses, ambiguities, or missing structural elements.\n\nSelf-Reflective Error Detection\n\nCritically evaluate the final prompt for potential errors, ambiguities, or biases.\n\nAnticipate edge cases and ensure correctness in domain-specific contexts (e.g., coding, legal, educational).\n\nConfirm the Final Prompt\n\nVerify that it meets the requirements stated under \"Task,\" \"Persona,\" \"Conditions,\" and \"Instructions.\"\n\nEnsure it maximizes precision, clarity, and reliability for the intended purpose.\n\nExpectations:\n\nThe resulting prompt must always be divided into the four pillars.\n\nKeep the text concise yet detailed enough to guide the user.\n\nRetain the original intent of the input while improving its structure and clarity.\n\nNotes\nUse this structure whenever you enhance or correct a prompt.\n\nRemember to maintain the user's core purpose and context; only refine language, order, and clarity.\n\nProvide any relevant examples for timelines, project management steps, or conceptual overviews at the end of your final output within this \"Notes\" section if applicable."
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

// Create a global event for template updates
export const addTemplate = async (template: TemplateType) => {
  try {
    // First, dispatch event for UI update
    const event = new CustomEvent('template-added', { detail: template });
    window.dispatchEvent(event);
    
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
    const event = new CustomEvent('template-deleted', { detail: { id: templateId } });
    window.dispatchEvent(event);
    
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
    
    // Save the selectedTemplateId to window for StepOne.tsx to access
    window.__selectedTemplate = templates.find(t => t.id === selectedTemplateId) || defaultTemplates[0];
  }, [user]);

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
    };

    window.addEventListener('template-added', handleTemplateAdded as EventListener);
    window.addEventListener('template-deleted', handleTemplateDeleted as EventListener);
    
    return () => {
      window.removeEventListener('template-added', handleTemplateAdded as EventListener);
      window.removeEventListener('template-deleted', handleTemplateDeleted as EventListener);
    };
  }, []);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    
    // Save selectedTemplateId to localStorage for persistence
    window.localStorage.setItem('selectedTemplateId', id);
    
    // Update the selected template in the window object for StepOne.tsx
    window.__selectedTemplate = templates.find(t => t.id === id) || defaultTemplates[0];
    
    // Show a toast notification
    const template = templates.find(t => t.id === id);
    if (template) {
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
