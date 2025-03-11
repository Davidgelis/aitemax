
import { useState } from 'react';
import { ImageUp } from 'lucide-react';
import { ImageUploadDialog } from './ImageUploadDialog';
import { Button } from "@/components/ui/button";
import { UploadedImage } from "./types";

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  images: UploadedImage[]; // This prop is now required
}

export const ImageUploader = ({ onImagesChange, maxImages = 1, images }: ImageUploaderProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleImagesUploaded = (newImages: UploadedImage[]) => {
    if (newImages.length > maxImages) {
      return;
    }
    
    onImagesChange(newImages);
  };
  
  return (
    <div>
      <Button
        onClick={() => setDialogOpen(true)}
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
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onImagesUploaded={handleImagesUploaded}
        maxImages={maxImages}
        currentImages={images}
      />
    </div>
  );
};
