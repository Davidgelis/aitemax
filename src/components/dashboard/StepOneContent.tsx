
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { Textarea } from "@/components/ui/textarea";
import { AIModel, UploadedImage } from "./types";
import { WebScanner } from "./WebScanner";
import { ImageUploader } from "./ImageUploader";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ModelSelector } from "./model-selector";
import { SmartContext } from "./SmartContext";
import { primaryToggles, secondaryToggles } from "./constants";
import { TemplateSelector } from "./TemplateSelector";
import { PromptTemplate } from "@/hooks/usePromptTemplates";

interface StepOneContentProps {
  promptText: string;
  setPromptText: (text: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel | null) => void;
  selectedCognitive: string | null;
  handleCognitiveToggle: (id: string) => void;
  onImagesChange: (images: UploadedImage[]) => void;
  onWebsiteScan: (url: string, instructions: string) => void;
  onSmartContext: (context: string, usageInstructions: string) => void;
  templates?: PromptTemplate[];
  selectedTemplate?: PromptTemplate | null;
  onTemplateSelect?: (template: PromptTemplate) => void;
  onCreateTemplate?: (template: Partial<PromptTemplate>) => Promise<PromptTemplate | null>;
  onUpdateTemplate?: (id: string, template: Partial<PromptTemplate>) => Promise<PromptTemplate | null>;
  onDeleteTemplate?: (id: string) => Promise<boolean>;
  isTemplateLoading?: boolean;
  isLoggedIn?: boolean;
}

export const StepOneContent = ({
  promptText,
  setPromptText,
  selectedPrimary,
  selectedSecondary,
  handlePrimaryToggle,
  handleSecondaryToggle,
  onAnalyze,
  isLoading,
  selectedModel,
  setSelectedModel,
  selectedCognitive,
  handleCognitiveToggle,
  onImagesChange,
  onWebsiteScan,
  onSmartContext,
  templates = [],
  selectedTemplate = null,
  onTemplateSelect,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  isTemplateLoading = false,
  isLoggedIn = false
}: StepOneContentProps) => {
  const [showContextTools, setShowContextTools] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Handler for image changes that updates local state and calls parent handler
  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    onImagesChange(images);
  };

  return (
    <div className="border rounded-xl p-6 bg-card">
      <div className="mb-6">
        <div className="flex flex-col">
          <label htmlFor="prompt" className="block text-primary font-bold mb-1">
            Enter your prompt
          </label>
          <Textarea
            id="prompt"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Type your prompt to start enhancing it using AI..."
            className="h-48 mb-4 border focus:border-[#33fea6] transition-all bg-background"
            autoFocus
          />
        </div>

        {onTemplateSelect && templates.length > 0 && (
          <div className="mb-6">
            <TemplateSelector
              templates={templates}
              selectedTemplate={selectedTemplate}
              onTemplateSelect={onTemplateSelect}
              onCreateTemplate={onCreateTemplate}
              onUpdateTemplate={onUpdateTemplate}
              onDeleteTemplate={onDeleteTemplate}
              isLoading={isTemplateLoading}
              isLoggedIn={isLoggedIn}
            />
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-primary font-bold mb-2">Primary Focus (optional)</label>
            <ScrollArea className="h-20 w-full rounded-md border p-2 mb-4">
              <div className="flex flex-wrap gap-2 mr-4">
                {primaryToggles.map(toggle => (
                  <TooltipProvider key={toggle.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Toggle
                          variant="outline"
                          pressed={selectedPrimary === toggle.id}
                          onPressedChange={() => handlePrimaryToggle(toggle.id)}
                          className={`rounded-full px-3 py-1 text-xs ${
                            selectedPrimary === toggle.id ? '!bg-[#33fea6]/20 border-[#33fea6]' : ''
                          }`}
                        >
                          {toggle.label}
                        </Toggle>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs p-3">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{toggle.label}</p>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            {toggle.definition}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Secondary Focus (optional)</label>
            <ScrollArea className="h-20 w-full rounded-md border p-2 mb-6">
              <div className="flex flex-wrap gap-2 mr-4">
                {secondaryToggles.map(toggle => (
                  <TooltipProvider key={toggle.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Toggle
                          variant="outline"
                          pressed={selectedSecondary === toggle.id}
                          onPressedChange={() => handleSecondaryToggle(toggle.id)}
                          className={`rounded-full px-3 py-1 text-xs ${
                            selectedSecondary === toggle.id ? '!bg-[#33fea6]/20 border-[#33fea6]' : ''
                          }`}
                        >
                          {toggle.label}
                        </Toggle>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs p-3">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{toggle.label}</p>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            {toggle.definition}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <button
          onClick={() => setShowContextTools(!showContextTools)}
          className="mb-4 text-[#33fea6] hover:text-[#33fea6]/90 font-medium text-sm focus:outline-none"
        >
          {showContextTools ? "Hide context tools" : "Show context tools"}
        </button>

        {showContextTools && (
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Image Context</h3>
                <ImageUploader
                  images={uploadedImages}
                  onImagesChange={handleImagesChange}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Website Content</h3>
                <WebScanner onWebsiteScan={onWebsiteScan} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Smart Context</h3>
              <SmartContext onSmartContext={onSmartContext} />
            </div>
          </div>
        )}

        <div className="flex flex-col items-start justify-start space-y-4">
          <ModelSelector
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />
          <button
            onClick={onAnalyze}
            disabled={!promptText.trim() || isLoading}
            className="aurora-button"
          >
            {isLoading ? "Analyzing..." : "Analyze Prompt"}
          </button>
        </div>
      </div>
    </div>
  );
};
