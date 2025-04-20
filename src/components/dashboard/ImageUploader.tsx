
import { useState, useEffect } from 'react';
import { ImageUp, Info, X } from 'lucide-react';
import { ImageUploadDialog } from './ImageUploadDialog';
import { Button } from "@/components/ui/button";
import { UploadedImage } from "./types";
import { ImageContextDialog } from './ImageContextDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  images: UploadedImage[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ImageUploader = ({ 
  onImagesChange, 
  maxImages = 1, 
  images,
  open = false,
  onOpenChange = () => {}
}: ImageUploaderProps) => {
  const [contextDialogOpen, setContextDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<UploadedImage | null>(null);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const [isProcessingContext, setIsProcessingContext] = useState(false);
  
  // When upload dialog opens, we should check if we have any images
  // If not, open the upload dialog directly
  useEffect(() => {
    if (open && images.length === 0) {
      // Keep the dialog open
    } else if (open && images.length > 0) {
      // If we have images but the user clicked "Image Smart Scan", 
      // we assume they want to add context to the first image
      const firstImageWithoutContext = images.find(img => !img.context);
      if (firstImageWithoutContext) {
        setCurrentImage(firstImageWithoutContext);
        setContextDialogOpen(true);
        onOpenChange(false); // Close the upload dialog since we're opening context dialog
      }
    }
  }, [open, images, onOpenChange]);
  
  const handleImagesUploaded = (newImages: UploadedImage[]) => {
    if (newImages.length > maxImages) {
      return;
    }
    
    // If we have a new image that wasn't there before, open the context dialog
    const newlyAddedImages = newImages.filter(
      newImg => !images.some(existingImg => existingImg.id === newImg.id)
    );
    
    if (newlyAddedImages.length > 0) {
      setCurrentImage(newlyAddedImages[0]);
      setContextDialogOpen(true);
      setIsProcessingContext(true); // Set flag to indicate we're in a context operation
    }
    
    onImagesChange(newImages);
  };
  
  const handleAddContext = (context: string) => {
    if (!currentImage) return;
    
    console.log("Adding context to image:", {
      imageId: currentImage.id,
      fileName: currentImage.file.name,
      contextLength: context.length,
      contextPreview: context.substring(0, 30) + "..."
    });
    
    // Update the image with context
    const updatedImages = images.map(img => 
      img.id === currentImage.id 
        ? { ...img, context } 
        : img
    );
    
    // Log the update to help debugging
    const updatedImage = updatedImages.find(img => img.id === currentImage.id);
    if (updatedImage) {
      console.log("Image updated with context:", {
        imageId: updatedImage.id,
        fileName: updatedImage.file.name,
        hasContext: !!updatedImage.context,
        contextLength: updatedImage.context ? updatedImage.context.length : 0,
        hasBase64: !!updatedImage.base64,
        base64Length: updatedImage.base64 ? updatedImage.base64.length : 0
      });
    }
    
    onImagesChange(updatedImages);
    
    // Close the context dialog
    setContextDialogOpen(false);
    
    // Wait a moment before clearing the processing flag to ensure step changes don't happen too quickly
    setTimeout(() => {
      setIsProcessingContext(false);
    }, 300);
  };

  // Function to handle opening context dialog for an existing image
  const handleEditContext = (image: UploadedImage) => {
    setIsProcessingContext(true); // Set flag before opening dialog
    setCurrentImage(image);
    setContextDialogOpen(true);
  };
  
  // Function to remove an image
  const handleRemoveImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    onImagesChange(updatedImages);
  };
  
  // Effect to sync the processing state with parent's preventStepChange
  useEffect(() => {
    // At component mount, ensure we're not in processing state
    if (!contextDialogOpen && !open) {
      setIsProcessingContext(false);
    }
  }, [contextDialogOpen, open]);
  
  return (
    <div>
      {/* Display existing images with context info */}
      {images.length > 0 && (
        <div className="mt-3 space-y-2">
          {images.map(image => (
            <div 
              key={image.id} 
              className="flex items-center gap-2 p-2 border border-[#e5e7eb] rounded-md bg-[#fafafa] relative"
              onMouseEnter={() => setHoveredImageId(image.id)}
              onMouseLeave={() => setHoveredImageId(null)}
            >
              <div className="relative">
                <img 
                  src={image.url} 
                  alt={image.file.name} 
                  className="w-10 h-10 object-cover rounded-md"
                />
                {hoveredImageId === image.id && (
                  <button
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm hover:bg-gray-100"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#545454] truncate">{image.file.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#545454]/70 truncate">
                    {image.context ? 'Context added' : 'No context added'}
                  </span>
                  {image.context && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Info className="w-3 h-3 text-[#084b49]" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{image.context}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <Button 
                variant="slim" 
                size="xs" 
                onClick={() => handleEditContext(image)}
                className="text-xs bg-transparent hover:bg-[#f0f0f0] text-[#084b49]"
              >
                {image.context ? 'Edit Context' : 'Add Context'}
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <ImageUploadDialog
        open={open}
        onOpenChange={onOpenChange}
        onImagesUploaded={handleImagesUploaded}
        maxImages={maxImages}
        currentImages={images}
      />
      
      <ImageContextDialog
        open={contextDialogOpen}
        onOpenChange={(open) => {
          setContextDialogOpen(open);
          // If dialog is closing, ensure we reset the processing state after a short delay
          if (!open) {
            setTimeout(() => {
              setIsProcessingContext(false);
            }, 300);
          }
        }}
        onConfirm={handleAddContext}
        imageName={currentImage?.file.name}
        savedContext={currentImage?.context || ''}
        required={true}
        stayOnCurrentStep={true}
        isProcessingContext={isProcessingContext}
      />
    </div>
  );
};
