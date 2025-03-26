
import { ToggleSection } from "./ToggleSection";
import { PromptEditor } from "./PromptEditor";
import { Separator } from "@/components/ui/separator";
import { primaryToggles, secondaryToggles } from "./constants";
import { useState, useEffect } from "react";
import { TemplateType } from "../x-templates/XTemplateCard";

// Get the default template
const getDefaultTemplate = (): TemplateType => {
  // This would normally come from a context, localStorage, or a more sophisticated state management
  return {
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
    characterLimit: 3000,
    isDefault: true,
    createdAt: "System Default"
  };
};

interface StepOneProps {
  promptText: string;
  setPromptText: (text: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const StepOne = ({
  promptText,
  setPromptText,
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle,
  onAnalyze,
  isLoading
}: StepOneProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  
  // Initialize with the default template
  useEffect(() => {
    setSelectedTemplate(getDefaultTemplate());
  }, []);

  // Expose the selected template to the parent component via window object
  // This is a workaround to avoid changing the component props structure
  useEffect(() => {
    if (selectedTemplate) {
      // @ts-ignore
      window.__selectedTemplate = selectedTemplate;
    }
  }, [selectedTemplate]);

  return (
    <>
      <ToggleSection 
        toggles={primaryToggles} 
        selectedToggle={selectedPrimary} 
        onToggleChange={handlePrimaryToggle} 
        variant="primary"
        tooltipText="Select a primary use case for your prompt"
      />

      <Separator className="my-4" />

      <ToggleSection 
        toggles={secondaryToggles} 
        selectedToggle={selectedSecondary} 
        onToggleChange={handleSecondaryToggle} 
        variant="secondary"
        tooltipText="Select a secondary feature for your prompt"
      />

      <PromptEditor 
        promptText={promptText}
        setPromptText={setPromptText}
        onAnalyze={onAnalyze}
        selectedPrimary={selectedPrimary}
        selectedSecondary={selectedSecondary}
        isLoading={isLoading}
        maxLength={selectedTemplate?.characterLimit || 3000}
      />
    </>
  );
};
