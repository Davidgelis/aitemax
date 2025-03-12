
import { useState } from 'react';
import { ImageUp } from 'lucide-react';
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
  
  return (
    <div>
      <Button
        onClick={() => onOpenChange(true)}
        variant="slim"
        size="xs"
        className="group animate-aurora-border rounded-md"
        title="Upload image"
        disabled={images.length >= maxImages}
      >
        <ImageUp className="w-3 h-3 text-white group-hover:text-white transition-colors" />
        <span className="text-white">Upload</span>
      </Button>
      
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
