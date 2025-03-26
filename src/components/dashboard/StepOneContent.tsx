import { useState, useEffect } from "react";
import PromptInput from "@/components/PromptInput";
import { WebScanner } from "@/components/dashboard/WebScanner";
import { SmartContext } from "@/components/dashboard/SmartContext";
import { primaryToggles, secondaryToggles } from "./constants";
import { AIModel, UploadedImage } from "./types";
import { Switch } from "@/components/ui/switch";
import { HelpCircle, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";
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
  onSmartContext?: (context: string, usageInstructions: string) => void;
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
  onWebsiteScan = () => {},
  onSmartContext = () => {}
}: StepOneContentProps) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [websiteContext, setWebsiteContext] = useState<{ url: string; instructions: string } | null>(null);
  const [smartContext, setSmartContext] = useState<{ context: string; usageInstructions: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const maxCharacterLimit = 3000; // Set the character limit to 3000

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    console.log("StepOneContent: Images updated:", images);
    // Pass the images up to the parent component without triggering analysis
    onImagesChange(images);
  };

  const handleWebsiteScan = (url: string, instructions: string = "") => {
    const contextData = { url, instructions };
    setWebsiteContext(contextData);
    console.log("StepOneContent: Website context set:", contextData);
    
    onWebsiteScan(url, instructions);
  };

  const handleSmartContext = (context: string, usageInstructions: string = "") => {
    const contextData = { context, usageInstructions };
    setSmartContext(contextData);
    console.log("StepOneContent: Smart context set:", {
      context: context.substring(0, 100) + (context.length > 100 ? "..." : ""),
      usageInstructions: usageInstructions.substring(0, 100) + (usageInstructions.length > 100 ? "..." : "")
    });
    
    onSmartContext(context, usageInstructions);
  };

  const handleAnalyzeWithContext = () => {
    console.log("StepOneContent: Analyzing with context:", {
      promptText,
      uploadedImages: uploadedImages.length,
      websiteContext,
      smartContext: smartContext ? "Provided" : "None",
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
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <WebScanner 
            onWebsiteScan={handleWebsiteScan}
            variant="modelReplacement"
          />
          <SmartContext
            onSmartContext={handleSmartContext}
            variant="modelReplacement"
          />
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
      </div>

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

      {smartContext && smartContext.context && (
        <div className="mb-4 p-3 bg-[#fafafa] border border-[#e5e7eb] rounded-md">
          <h3 className="text-sm font-medium text-[#545454] mb-2">Smart Context Added</h3>
          <p className="text-xs text-[#545454] italic truncate">
            {smartContext.context.substring(0, 100)}
            {smartContext.context.length > 100 ? "..." : ""}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {primaryToggles.map(toggle => (
          <div 
            key={toggle.id}
            className="border rounded-lg p-3 flex justify-between items-center"
            data-variant="primary"
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
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button 
                      className="tooltip-trigger text-[#545454] opacity-70 hover:opacity-100"
                      aria-label={`Learn more about ${toggle.label}`}
                    >
                      <HelpCircle className="h-4 w-4 tooltip-icon" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    {toggle.definition}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {secondaryToggles.map(toggle => (
          <div 
            key={toggle.id}
            className="border rounded-lg p-3 flex justify-between items-center"
            data-variant="secondary"
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
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button 
                      className="tooltip-trigger text-[#545454] opacity-70 hover:opacity-100"
                      aria-label={`Learn more about ${toggle.label}`}
                    >
                      <HelpCircle className="h-4 w-4 tooltip-icon" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    {toggle.definition}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>

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
          maxLength={maxCharacterLimit}
        />
      </div>

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
