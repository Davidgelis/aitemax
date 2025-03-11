import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PromptInput from "@/components/PromptInput"; // Fixed import
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { WebScanner } from "@/components/dashboard/WebScanner";
import { primaryToggles, secondaryToggles } from "./constants";
import { AIModel, UploadedImage } from "./types";
import { ModelSelector } from "./model-selector"; // Fixed import

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
  onImagesChange?: (images: UploadedImage[]) => void;
  onWebsiteScan?: (url: string, instructions: string) => void;
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
  onImagesChange = () => {},
  onWebsiteScan = () => {}
}: StepOneContentProps) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [websiteContext, setWebsiteContext] = useState<{ url: string; instructions: string } | null>(null);

  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(uploadedImages);
    }
  }, [uploadedImages, onImagesChange]);

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    console.log("Images updated:", images);
  };

  const handleWebsiteScan = (url: string, instructions: string = "") => {
    const contextData = { url, instructions };
    setWebsiteContext(contextData);
    onWebsiteScan(url, instructions);
    console.log("Website context set:", contextData);
  };

  const handleAnalyzeWithContext = () => {
    console.log("Analyzing with full context:", {
      promptText,
      uploadedImages,
      websiteContext,
      selectedPrimary,
      selectedSecondary
    });
    
    onAnalyze();
  };

  const renderPromptInput = (placeholder?: string) => (
    <div className="relative">
      <PromptInput 
        value={promptText}
        onChange={setPromptText}
        onSubmit={handleAnalyzeWithContext}
        placeholder={placeholder}
        className="w-full"
        images={uploadedImages}
        onImagesChange={handleImagesChange}
      />
    </div>
  );

  return (
    <div className="border rounded-xl p-6 bg-card">
      {/* Web Smart Scan button */}
      <div className="mb-4">
        <WebScanner 
          onWebsiteScan={handleWebsiteScan}
          variant="modelReplacement"
        />
      </div>

      {/* Main content area */}
      <div className="mb-8">
        {renderPromptInput("Enter your prompt...")}
      </div>

      {/* Toggle sections */}
      <div className="space-y-6">
        {/* Prompt Type */}
        <div className="space-y-3">
          <h3 className="text-[#545454] font-medium mb-2">Prompt Type</h3>
          <div className="flex flex-wrap gap-2">
            {primaryToggles.map(toggle => (
              <button
                key={toggle.id}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors
                  ${selectedPrimary === toggle.id 
                    ? 'bg-[#084b49] text-white' 
                    : 'border border-[#084b49] text-[#084b49]'}`}
                onClick={() => handlePrimaryToggle(toggle.id)}
              >
                {toggle.label}
              </button>
            ))}
          </div>
        </div>

        {/* Response Style */}
        <div className="space-y-3">
          <h3 className="text-[#545454] font-medium mb-2">Response Style</h3>
          <div className="flex flex-wrap gap-2">
            {secondaryToggles.map(toggle => (
              <button
                key={toggle.id}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors
                  ${selectedSecondary === toggle.id 
                    ? 'bg-[#084b49] text-white' 
                    : 'border border-[#084b49] text-[#084b49]'}`}
                onClick={() => handleSecondaryToggle(toggle.id)}
              >
                {toggle.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Model */}
        <div className="flex justify-between items-center">
          <h3 className="text-[#545454] font-medium">AI Model</h3>
          <ModelSelector
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
            isInitializingModels={false}
          />
        </div>
      </div>
    </div>
  );
};
