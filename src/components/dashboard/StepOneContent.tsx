
import { ToggleSection } from "./ToggleSection";
import { PromptEditor } from "./PromptEditor";
import { Separator } from "@/components/ui/separator";
import { primaryToggles, secondaryToggles } from "./constants";
import { ModelSelector } from "./model-selector";
import { AIModel } from "./types";
import { useState } from "react";
import { UploadedImage } from "./ImageUploader";
import { ImageCarousel } from "./ImageCarousel";
import { X } from "lucide-react";

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
  
  const cognitiveTooltip = 
    "This button will conduct a final precision-driven refinement of the generated prompt as a second layer of refinment, ensuring you receive the best possible prompt by eliminating ambiguities, reinforcing clarity, and ensuring domain-specific accuracy for optimal task execution.";
  
  const cognitiveToggle = [{ label: "Cognitive Prompt Perfection Model", id: "cognitive" }];
  
  const handleImageClick = (id: string) => {
    setSelectedImageId(id);
    setCarouselOpen(true);
  };
  
  const handleRemoveImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the carousel from opening when clicking delete
    
    const imageToRemove = uploadedImages.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    const updatedImages = uploadedImages.filter(img => img.id !== id);
    setUploadedImages(updatedImages);
  };
  
  return (
    <div className="space-y-4 w-full relative">
      {uploadedImages.length > 0 && (
        <div className="absolute top-2 right-2 flex flex-wrap gap-2 justify-end max-w-[200px] z-10">
          {uploadedImages.map(image => (
            <div key={image.id} className="relative group">
              <img 
                src={image.url} 
                alt="Uploaded" 
                className="w-12 h-12 object-cover rounded-md border border-[#64bf95] cursor-pointer"
                onClick={() => handleImageClick(image.id)}
              />
              <button
                onClick={(e) => handleRemoveImage(image.id, e)}
                className="absolute -top-2 -right-2 bg-[#041524] text-white rounded-full p-0.5 border border-[#64bf95] opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="w-full">
        <div className="flex justify-between items-center">
          <ModelSelector 
            onSelect={setSelectedModel} 
            selectedModel={selectedModel}
          />
          
          {/* Container with flex to position toggle and help icon properly */}
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
            onAnalyze={onAnalyze}
            selectedPrimary={selectedPrimary}
            selectedSecondary={selectedSecondary}
            isLoading={isLoading}
            images={uploadedImages}
            onImagesChange={setUploadedImages}
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
