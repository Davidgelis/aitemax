
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
