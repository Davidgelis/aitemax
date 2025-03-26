
import { useState } from "react";
import { XTemplateCard, TemplateType } from "./XTemplateCard";
import { useToast } from "@/hooks/use-toast";

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
    isDefault: true,
    createdAt: "System Default"
  },
  {
    id: "creative",
    name: "Creative Writing Specialist",
    role: "You are a master storyteller and creative writing expert that helps craft engaging narratives and characters.",
    pillars: [
      {
        id: "1",
        title: "Narrative Structure",
        description: "Apply classic or experimental narrative structures appropriate to the genre."
      },
      {
        id: "2",
        title: "Character Development",
        description: "Create multidimensional characters with clear motivations and arcs."
      },
      {
        id: "3",
        title: "Setting & Atmosphere",
        description: "Build immersive worlds with sensory details and atmosphere."
      },
      {
        id: "4",
        title: "Voice & Style",
        description: "Adapt tone, vocabulary, and pacing to match the intended style."
      }
    ],
    temperature: 0.9,
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
  );
};
