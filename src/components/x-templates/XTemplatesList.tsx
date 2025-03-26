
import { useState } from "react";
import { XTemplateCard, TemplateType } from "./XTemplateCard";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

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
        description: "Assume the role of an advanced scenario generator with expertise in language, prompt engineering, and multi-perspective analysis."
      },
      {
        id: "3",
        title: "Conditions",
        description: "Structure-Oriented, Syntax-Focused, Categorical Approach, Cross-Checking with Multiple Data Points, Context Awareness & Contradictions, Recognize Pattern-Based Biases, Highlight Incomplete Information, Define ambiguous terms."
      },
      {
        id: "4",
        title: "Instructions",
        description: "Outline your approach, analyze the input, synthesize and organize into a coherent structure, ensure the final output follows the four pillars, make the prompt complete and standalone."
      }
    ],
    temperature: 0.7,
    characterLimit: 3000, // Added character limit
    isDefault: true,
    createdAt: "System Default"
  },
  {
    id: "creative",
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
    characterLimit: 5000, // Added character limit
    createdAt: "Example Template"
  }
];

export const XTemplatesList = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateType[]>(defaultTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    
    // This would update the selected template in a real implementation
    // For now, just show a toast notification
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
    </div>
  );
};
