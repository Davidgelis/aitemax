
import { useState } from 'react';
import { ImageUp, Info } from 'lucide-react';
import { ImageUploadDialog } from './ImageUploadDialog';
import { Button } from "@/components/ui/button";
import { UploadedImage } from "./types";
import { ImageContextDialog } from './ImageContextDialog';

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
    }
    
    onImagesChange(newImages);
  };
  
  const handleAddContext = (context: string) => {
    if (!currentImage) return;
    
    // Update the image with context
    const updatedImages = images.map(img => 
      img.id === currentImage.id 
        ? { ...img, context } 
        : img
    );
    
    onImagesChange(updatedImages);
  };

  // Function to handle opening context dialog for an existing image
  const handleEditContext = (image: UploadedImage) => {
    setCurrentImage(image);
    setContextDialogOpen(true);
  };
  
  return (
    <div>
      <Button
        onClick={() => onOpenChange(true)}
        variant="slim"
        size="xs"
        className="group animate-aurora-border rounded-md flex items-center gap-2"
        title="Upload image"
        disabled={images.length >= maxImages}
      >
        <ImageUp className="w-3 h-3 text-white group-hover:text-white transition-colors" />
        <span className="text-white">Upload</span>
      </Button>
      
      {/* Display existing images with context info */}
      {images.length > 0 && (
        <div className="mt-3 space-y-2">
          {images.map(image => (
            <div 
              key={image.id} 
              className="flex items-center gap-2 p-2 border border-[#e5e7eb] rounded-md bg-[#fafafa]"
            >
              <img 
                src={image.url} 
                alt={image.file.name} 
                className="w-10 h-10 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#545454] truncate">{image.file.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#545454]/70 truncate">
                    {image.context ? 'Context added' : 'No context added'}
                  </span>
                  {image.context && (
                    <Info className="w-3 h-3 text-[#084b49]" title={image.context} />
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
        onOpenChange={setContextDialogOpen}
        onConfirm={handleAddContext}
        imageName={currentImage?.file.name}
        savedContext={currentImage?.context || ''}
      />
    </div>
  );
};
