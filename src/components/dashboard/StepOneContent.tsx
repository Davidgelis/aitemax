
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { usePromptState } from "@/hooks/usePromptState";
import { useAuth } from "@/context/AuthContext";
import { TemplateSelector } from "./TemplateSelector";
import { PromptTemplate } from "./types";

interface Props {
  onNext: () => void;
}

const StepOneContent: React.FC<Props> = ({ onNext }) => {
  const { user } = useAuth();
  const {
    promptText,
    setPromptText,
    setCurrentStep,
    questions,
    setQuestions,
    currentQuestionPage,
    isLoadingPrompts,
    setFinalPrompt,
    selectedTemplate,
    setSelectedTemplate,
  } = usePromptState(user);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzePrompt = async () => {
    if (!promptText.trim()) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // Set the final prompt initially to the same as the input prompt
      setFinalPrompt(promptText);
      
      // Move to step 2
      setCurrentStep(2);
      onNext();
    } catch (error) {
      console.error("Error analyzing prompt:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">1. Enter Your Prompt</h2>
          <TemplateSelector onSelectTemplate={handleSelectTemplate} />
        </div>
        
        <p className="text-gray-500">
          Start by typing or pasting your prompt. We'll help you improve it with
          AI suggestions.
        </p>
      </div>

      <Textarea
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="Type or paste your prompt here..."
        className="min-h-[200px] resize-none"
      />

      {selectedTemplate && (
        <div className="bg-primary/5 p-4 rounded-md">
          <h3 className="font-medium mb-2">Using Template: {selectedTemplate.title}</h3>
          <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
          
          <div className="mt-3">
            <h4 className="text-sm font-medium">Template Sections:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {selectedTemplate.pillars.map(pillar => (
                <li key={pillar.id}>{pillar.name}: {pillar.content}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleAnalyzePrompt}
          disabled={!promptText.trim() || isAnalyzing || isLoadingPrompts}
          className="w-full md:w-auto"
        >
          {isAnalyzing || isLoadingPrompts ? (
            <>
              <span className="mr-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </span>
              Analyzing...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepOneContent;
