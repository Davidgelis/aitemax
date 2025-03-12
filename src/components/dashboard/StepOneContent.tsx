import { useState, useEffect } from "react";
import PromptInput from "@/components/PromptInput";
import { WebScanner } from "@/components/dashboard/WebScanner";
import { primaryToggles, secondaryToggles } from "./constants";
import { AIModel, UploadedImage } from "./types";
import { Switch } from "@/components/ui/switch";
import { HelpCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    setWebsiteContext(contextData);
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
        {primaryToggles.map(toggle => {
          const definition = toggle.definition || "";
          
          return (
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
                {definition && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button className="text-[#b4b4b4] hover:text-[#084b49] transition-colors">
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs bg-white text-justify">
                        {definition}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toggle sections for response styles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {secondaryToggles.map(toggle => {
          const definition = toggle.definition || "";
          
          return (
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
                {definition && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button className="text-[#b4b4b4] hover:text-[#084b49] transition-colors">
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs bg-white text-justify">
                        {definition}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          );
        })}
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

      {/* Action buttons */}
      <div className="flex justify-between mt-8">
        <div>
          <Button
            onClick={handleOpenUploadDialog}
            disabled={isLoading}
            className="bg-[#33fea6] hover:bg-[#28d88c] text-white rounded-md flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Image
          </Button>
        </div>
        
        <div>
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
    </div>
  );
};
