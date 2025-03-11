
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
  const [activeTab, setActiveTab] = useState<string>("prompt");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Ensure images are passed to parent component
  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(uploadedImages);
    }
  }, [uploadedImages, onImagesChange]);

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    
    // Log to verify image data is being captured
    console.log("Uploaded images updated:", images);
  };

  const handleWebsiteScan = (url: string, instructions: string = "") => {
    if (onWebsiteScan) {
      onWebsiteScan(url, instructions);
    }
    // Log to verify website scan is being triggered
    console.log("Website scan triggered:", { url, instructions });
  };

  // Analyze function that ensures we gather all context
  const handleAnalyze = () => {
    // Logging to verify the data being passed to analysis
    console.log("Analyzing with context:", {
      hasImages: uploadedImages.length > 0,
      images: uploadedImages,
      websiteContext: true, // Will be populated by parent component
      primaryToggle: selectedPrimary,
      secondaryToggle: selectedSecondary
    });
    
    onAnalyze();
  };

  return (
    <div className="border rounded-xl p-6 bg-card">
      <Tabs defaultValue="prompt" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prompt" className="min-h-[400px]">
          <PromptInput 
            value={promptText} 
            onChange={setPromptText} 
            onSubmit={handleAnalyze}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="image" className="min-h-[400px]">
          <div className="space-y-6">
            <ImageUploader 
              images={uploadedImages}
              onImagesChange={handleImagesChange}
            />
            
            <PromptInput 
              value={promptText} 
              onChange={setPromptText} 
              onSubmit={handleAnalyze}
              isLoading={isLoading}
              placeholder="Describe what you want to generate using this image as reference..."
            />
          </div>
        </TabsContent>
        
        <TabsContent value="website" className="min-h-[400px]">
          <div className="space-y-6">
            <WebScanner onWebsiteScan={handleWebsiteScan} />
            
            <PromptInput 
              value={promptText} 
              onChange={setPromptText} 
              onSubmit={handleAnalyze}
              isLoading={isLoading}
              placeholder="Describe what you want to generate using the website content as reference..."
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 space-y-6">
        <div className="space-y-3">
          <h3 className="text-[#545454] font-medium mb-2">Prompt Type</h3>
          <div className="flex flex-wrap gap-2">
            {primaryToggles.map(toggle => (
              <button
                key={toggle.id}
                className={`px-4 py-1.5 rounded-full text-sm 
                  ${selectedPrimary === toggle.id 
                    ? 'bg-[#084b49] text-white' 
                    : 'border border-[#084b49] text-[#084b49]'
                  } transition-colors`}
                onClick={() => handlePrimaryToggle(toggle.id)}
              >
                {toggle.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-[#545454] font-medium mb-2">Response Style</h3>
          <div className="flex flex-wrap gap-2">
            {secondaryToggles.map(toggle => (
              <button
                key={toggle.id}
                className={`px-4 py-1.5 rounded-full text-sm 
                  ${selectedSecondary === toggle.id 
                    ? 'bg-[#084b49] text-white' 
                    : 'border border-[#084b49] text-[#084b49]'
                  } transition-colors`}
                onClick={() => handleSecondaryToggle(toggle.id)}
              >
                {toggle.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
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
    </div>
  );
};
