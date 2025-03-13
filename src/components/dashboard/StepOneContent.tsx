
import { useState, useEffect } from "react";
import PromptInput from "@/components/PromptInput";
import { WebScanner } from "@/components/dashboard/WebScanner";
import { primaryToggles, secondaryToggles } from "./constants";
import { AIModel, UploadedImage } from "./types";
import { Switch } from "@/components/ui/switch";
import { HelpCircle, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";

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
  const [dialogOpen, setDialogOpen] = useState(false);

  // Ensure images are passed to parent component
  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(uploadedImages);
    }
  }, [uploadedImages, onImagesChange]);

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    console.log("StepOneContent: Images updated:", images);
  };

  const handleWebsiteScan = (url: string, instructions: string = "") => {
    const contextData = { url, instructions };
    setWebsiteContext(url ? contextData : null);
    console.log("StepOneContent: Website context set:", contextData);
    
    // Important: Forward to parent component
    onWebsiteScan(url, instructions);
  };

  const handleAnalyzeWithContext = () => {
    console.log("StepOneContent: Analyzing with context:", {
      promptText,
      uploadedImages,
      websiteContext,
      selectedPrimary,
      selectedSecondary
    });
    
    onAnalyze();
  };

  const handleOpenUploadDialog = () => {
    setDialogOpen(true);
  };

  return (
    <div className="border rounded-xl p-6 bg-card">
      {/* Web Smart Scan and Image Upload buttons */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <WebScanner 
            onWebsiteScan={handleWebsiteScan}
            variant="modelReplacement"
          />
          
          {/* Image Upload button styled similar to Web Smart Scan */}
          <div className="w-full">
            <div className="flex items-center">
              <button 
                onClick={handleOpenUploadDialog}
                className="w-[220px] h-10 bg-white border border-[#e5e7eb] text-[#545454] hover:bg-[#f8f9fa] flex justify-between items-center shadow-sm text-sm rounded-md px-4"
                title="Upload and analyze images with specific context"
              >
                <span className="truncate ml-1">Image Smart Scan</span>
                <ImageUp className="mr-1 h-4 w-4 text-[#084b49]" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-[#545454] text-sm">Cognitive Prompt Perfection Model</span>
          <Switch 
            checked={selectedCognitive !== null}
            onCheckedChange={() => handleCognitiveToggle('cognitive')}
            variant="aurora"
          />
        </div>
      </div>

      {/* Display any uploaded images with their context */}
      {uploadedImages.length > 0 && (
        <div className="mb-4 p-3 bg-[#fafafa] border border-[#e5e7eb] rounded-md">
          <h3 className="text-sm font-medium text-[#545454] mb-2">Uploaded Images</h3>
          <ImageUploader
            images={uploadedImages}
            onImagesChange={handleImagesChange}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        </div>
      )}

      {/* Toggle sections for prompt types - using primary variant for top toggles */}
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
                variant="primary"  
              />
              <HelpCircle className="h-4 w-4 text-[#545454] opacity-70" />
            </div>
          </div>
        ))}
      </div>

      {/* Toggle sections for response styles - using secondary variant for bottom toggles */}
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
                variant="secondary"
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
          className="w-full"
          images={uploadedImages}
          onImagesChange={handleImagesChange}
          isLoading={isLoading}
          onOpenUploadDialog={handleOpenUploadDialog}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
        />
      </div>

      {/* Action button */}
      <div className="flex justify-end mt-8">
        <Button
          onClick={handleAnalyzeWithContext}
          disabled={isLoading || !promptText.trim()}
          variant="aurora"
          className="ml-2"
        >
          {isLoading ? "Analyzing..." : "Analyze with AI"}
        </Button>
      </div>
    </div>
  );
};
