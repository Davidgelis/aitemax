
import { useState } from 'react';
import { ImageUp } from 'lucide-react';
import { ImageUploadDialog } from './ImageUploadDialog';
import { Button } from "@/components/ui/button";
import { UploadedImage } from "./types";

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
  const handleImagesUploaded = (newImages: UploadedImage[]) => {
    if (newImages.length > maxImages) {
      return;
    }
    
    onImagesChange(newImages);
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
    </div>
  );
};
