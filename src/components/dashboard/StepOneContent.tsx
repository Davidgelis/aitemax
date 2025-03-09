
import { ToggleSection } from "./ToggleSection";
import { PromptEditor } from "./PromptEditor";
import { Separator } from "@/components/ui/separator";
import { primaryToggles, secondaryToggles } from "./constants";
import { useState } from "react";
import { UploadedImage } from "./types";
import { ImageCarousel } from "./ImageCarousel";
import { WebScanner } from "./WebScanner";

interface StepOneContentProps {
  promptText: string;
  setPromptText: (text: string) => void;
  selectedPrimary: string | null;
  selectedSecondary: string | null;
  handlePrimaryToggle: (id: string) => void;
  handleSecondaryToggle: (id: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  selectedModel: any | null;
  setSelectedModel: (model: any | null) => void;
  selectedCognitive: string | null;
  handleCognitiveToggle: (id: string) => void;
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
  handleCognitiveToggle
}: StepOneContentProps) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [websiteContext, setWebsiteContext] = useState<{ url: string; instructions: string } | null>(null);
  
  const cognitiveTooltip = 
    "This button will conduct a final precision-driven refinement of the generated prompt as a second layer of refinment, ensuring you receive the best possible prompt by eliminating ambiguities, reinforcing clarity, and ensuring domain-specific accuracy for optimal task execution.";
  
  const cognitiveToggle = [{ label: "Cognitive Prompt Perfection Model", id: "cognitive" }];
  
  const handleWebsiteScan = (url: string, instructions: string) => {
    setWebsiteContext({ url, instructions });
    
    // Add a console log to verify the website context is being set
    console.log("Website context set in StepOneContent:", { url, instructions });
  };
  
  const handleAnalyzeWithContext = () => {
    // Console log to verify what data is being passed to analysis
    console.log("Analyzing with context:", {
      hasImages: uploadedImages.length > 0,
      websiteContext: websiteContext,
      primaryToggle: selectedPrimary,
      secondaryToggle: selectedSecondary
    });
    
    // Call the parent's onAnalyze function with additional context
    onAnalyze();
  };
  
  return (
    <div className="space-y-4 w-full relative">
      <div className="w-full">
        <div className="flex justify-between items-center">
          <WebScanner 
            onWebsiteScan={handleWebsiteScan} 
            variant="modelReplacement" 
          />
          
          <div className="flex items-center">
            <ToggleSection 
              toggles={cognitiveToggle} 
              selectedToggle={selectedCognitive} 
              onToggleChange={handleCognitiveToggle}
              variant="aurora"
              tooltipText={cognitiveTooltip}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <ToggleSection 
            toggles={primaryToggles} 
            selectedToggle={selectedPrimary} 
            onToggleChange={handlePrimaryToggle} 
            variant="primary"
          />
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <ToggleSection 
            toggles={secondaryToggles} 
            selectedToggle={selectedSecondary} 
            onToggleChange={handleSecondaryToggle} 
            variant="secondary"
          />
        </div>
        
        <div className="mt-6">
          <PromptEditor 
            promptText={promptText}
            setPromptText={setPromptText}
            onAnalyze={handleAnalyzeWithContext}
            selectedPrimary={selectedPrimary}
            selectedSecondary={selectedSecondary}
            isLoading={isLoading}
            images={uploadedImages}
            onImagesChange={setUploadedImages}
            websiteContext={websiteContext}
          />
        </div>
      </div>
      
      <ImageCarousel 
        images={uploadedImages}
        open={carouselOpen}
        onOpenChange={setCarouselOpen}
        initialImageId={selectedImageId || undefined}
      />
    </div>
  );
};
