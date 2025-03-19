
import { useState, useEffect } from "react";
import PromptInput from "@/components/PromptInput";
import { WebScanner } from "@/components/dashboard/WebScanner";
import { SmartContext } from "@/components/dashboard/SmartContext";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { primaryToggles, secondaryToggles } from "@/components/dashboard/constants";
import { UploadedImage, AIModel } from "@/components/dashboard/types";
import { ModelSelector } from "@/components/dashboard/model-selector";
import { ModelRefreshButton } from "@/components/dashboard/ModelRefreshButton";
import { Button } from "@/components/ui/button";
import { PrivacyCheckbox } from "@/components/dashboard/PrivacyCheckbox";
import { usePromptAnalysis } from "@/hooks/usePromptAnalysis";
import { LoadingState } from "@/components/dashboard/LoadingState";

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
  onSmartContext: (context: string, instructions: string) => void;
  isPrivate?: boolean;
  setIsPrivate?: (isPrivate: boolean) => void;
}

export const StepOneContent: React.FC<StepOneContentProps> = ({
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
  isPrivate = false,
  setIsPrivate = () => {}
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [websiteInstructions, setWebsiteInstructions] = useState<string>("");
  const [showWebScanner, setShowWebScanner] = useState<boolean>(false);
  const [smartContextText, setSmartContextText] = useState<string>("");
  const [smartContextInstructions, setSmartContextInstructions] = useState<string>("");
  const [showSmartContext, setShowSmartContext] = useState<boolean>(false);
  const [showImageUploader, setShowImageUploader] = useState<boolean>(false);
  
  // This is key - we need to use the usePromptAnalysis hook here
  const { isLoading: isAnalyzing, handleAnalyze, currentLoadingMessage } = usePromptAnalysis(
    promptText,
    () => {}, // This will be handled by StepController
    () => {}, // This will be handled by StepController
    () => {}, // This will be handled by StepController
    () => {}, // This will be handled by StepController
    () => {}, // This will be handled by StepController
    selectedPrimary,
    selectedSecondary
  );

  // Handle image uploads
  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    onImagesChange(images);
  };

  // Handle website scan
  const handleWebsiteScan = (url: string, instructions: string) => {
    setWebsiteUrl(url);
    setWebsiteInstructions(instructions);
    onWebsiteScan(url, instructions);
    setShowWebScanner(false);
  };

  // Handle smart context
  const handleSmartContext = (context: string, instructions: string) => {
    setSmartContextText(context);
    setSmartContextInstructions(instructions);
    onSmartContext(context, instructions);
    setShowSmartContext(false);
  };

  // Fix the analyze function to properly trigger the analysis
  const handleAnalyzeClick = async () => {
    // Get any website context data if available
    const websiteData = websiteUrl 
      ? { url: websiteUrl, instructions: websiteInstructions }
      : null;
    
    // Get any smart context data if available
    const smartContextData = smartContextText
      ? { context: smartContextText, usageInstructions: smartContextInstructions }
      : null;

    try {
      // First trigger the actual analysis with all our context
      await handleAnalyze(uploadedImages, websiteData, smartContextData);
      
      // Then call the onAnalyze callback to advance to the next step
      onAnalyze();
    } catch (error) {
      console.error("Error during analysis:", error);
      // Still move to the next step even if there was an error
      onAnalyze();
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="w-full space-y-4">
        <h1 className="text-3xl font-bold">Create Prompt</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter your prompt below and we'll help you enhance it
        </p>
      </div>

      <div>
        <PromptInput 
          value={promptText} 
          onChange={setPromptText} 
          placeholder="Describe what you want the AI to do..."
          className="min-h-[200px]"
          onSubmit={() => {}} // Added empty onSubmit function to satisfy required prop
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col space-y-2 w-full">
          <span className="text-sm font-medium text-muted-foreground">Smart Tools</span>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowWebScanner(true)}
              className={websiteUrl ? "border-[#33fea6] text-[#33fea6]" : ""}
            >
              {websiteUrl ? "Web Smart Scan ✓" : "Web Smart Scan"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowSmartContext(true)}
              className={smartContextText ? "border-[#33fea6] text-[#33fea6]" : ""}
            >
              {smartContextText ? "Smart Context ✓" : "Smart Context"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowImageUploader(true)}
              className={uploadedImages.length > 0 ? "border-[#33fea6] text-[#33fea6]" : ""}
            >
              {uploadedImages.length > 0 ? `Image Smart Scan (${uploadedImages.length}) ✓` : "Image Smart Scan"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col space-y-2 w-full">
          <span className="text-sm font-medium text-muted-foreground">Add Context</span>
          <div className="flex gap-2">
            {primaryToggles.map((toggle) => (
              <Button
                key={toggle.id}
                variant={selectedPrimary === toggle.id ? "aurora" : "outline"}
                onClick={() => handlePrimaryToggle(toggle.id)}
              >
                {toggle.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col space-y-2 w-full">
          <span className="text-sm font-medium text-muted-foreground">Format Options</span>
          <div className="flex gap-2">
            {secondaryToggles.map((toggle) => (
              <Button
                key={toggle.id}
                variant={selectedSecondary === toggle.id ? "aurora" : "outline"}
                onClick={() => handleSecondaryToggle(toggle.id)}
              >
                {toggle.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {selectedModel && (
        <div>
          <ModelSelector
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />
          <ModelRefreshButton />
        </div>
      )}

      <div className="space-y-4">
        <PrivacyCheckbox 
          isPrivate={isPrivate}
          onChange={setIsPrivate}
        />
        
        <Button 
          className="w-full aurora-button dark:aurora-button-dark"
          size="lg"
          disabled={!promptText.trim() || isLoading || isAnalyzing}
          onClick={handleAnalyzeClick}
        >
          {isLoading || isAnalyzing ? "Analyzing..." : "Analyze with AI"}
        </Button>
      </div>

      {(isLoading || isAnalyzing) && (
        <LoadingState 
          currentLoadingMessage={currentLoadingMessage || "Analyzing your prompt..."}
        />
      )}

      {showWebScanner && (
        <WebScanner
          onWebsiteScan={handleWebsiteScan}
        />
      )}

      {showSmartContext && (
        <SmartContext
          onSmartContext={handleSmartContext}
        />
      )}

      {showImageUploader && (
        <ImageUploader
          open={showImageUploader}
          onOpenChange={setShowImageUploader}
          onImagesChange={handleImagesChange}
          images={uploadedImages}
        />
      )}
    </div>
  );
};
