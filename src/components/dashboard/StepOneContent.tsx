
import { useState, useEffect } from "react";
import PromptInput from "@/components/PromptInput";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { WebScanner } from "@/components/dashboard/WebScanner";
import { primaryToggles, secondaryToggles } from "./constants";
import { AIModel, UploadedImage } from "./types";
import { ModelSelector } from "./model-selector";
import { Switch } from "@/components/ui/switch";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="border rounded-xl p-6 bg-card">
      {/* Web Smart Scan button */}
      <div className="mb-4 flex justify-between items-center">
        <WebScanner 
          onWebsiteScan={handleWebsiteScan}
          variant="modelReplacement"
        />
        
        <div className="flex items-center space-x-2">
          <span className="text-[#545454] text-sm">Cognitive Prompt Perfection Model</span>
          <Switch 
            checked={selectedCognitive !== null}
            onCheckedChange={() => handleCognitiveToggle('cognitive')}
            variant="aurora"
          />
        </div>
      </div>

      {/* Toggle sections for prompt types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {primaryToggles.map(toggle => (
          <div 
            key={toggle.id}
            className="border rounded-lg p-3 flex justify-between items-center"
          >
            <div className="text-[#545454] text-sm">
              {toggle.label}
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={selectedPrimary === toggle.id}
                onCheckedChange={() => handlePrimaryToggle(toggle.id)}
                variant={toggle.id === "image" ? "primary" : "aurora"}
              />
              <HelpCircle className="h-4 w-4 text-[#545454] opacity-70" />
            </div>
          </div>
        ))}
      </div>

      {/* Toggle sections for response styles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {secondaryToggles.map(toggle => (
          <div 
            key={toggle.id}
            className="border rounded-lg p-3 flex justify-between items-center"
          >
            <div className="text-[#545454] text-sm">
              {toggle.label}
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={selectedSecondary === toggle.id}
                onCheckedChange={() => handleSecondaryToggle(toggle.id)}
                variant={toggle.id === "strict" ? "secondary" : "aurora"}
              />
              <HelpCircle className="h-4 w-4 text-[#545454] opacity-70" />
            </div>
          </div>
        ))}
      </div>

      {/* Main prompt input */}
      <div className="mb-6">
        <PromptInput 
          value={promptText}
          onChange={setPromptText}
          onSubmit={handleAnalyzeWithContext}
          placeholder="Generate a monet style image of trees"
          className="w-full"
          images={uploadedImages}
          onImagesChange={handleImagesChange}
          isLoading={isLoading}
        />
      </div>

      {/* Action buttons */}
      <div className="flex justify-between mt-8">
        <div>
          <Button
            variant="analyze"
            size="sm"
            onClick={() => {
              // Open the upload dialog through the ImageUploader component
              const uploadButton = document.querySelector("[title='Upload image']") as HTMLButtonElement;
              if (uploadButton) uploadButton.click();
            }}
            className="bg-[#33fea6] hover:bg-[#2be090] text-white"
            disabled={isLoading}
          >
            Upload
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <span className="text-[#545454] px-4 py-1 border rounded">2</span>
          <span className="text-[#545454] px-4 py-1 border rounded">3</span>
          
          <Button
            onClick={handleAnalyzeWithContext}
            disabled={isLoading || !promptText.trim()}
            className="ml-2 bg-[#084b49] hover:bg-[#063b39] text-white"
          >
            {isLoading ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </div>
      </div>
    </div>
  );
};
