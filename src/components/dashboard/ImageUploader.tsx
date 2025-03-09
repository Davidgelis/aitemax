
import { useState } from 'react';
import { ImageUp } from 'lucide-react';
import { ImageUploadDialog } from './ImageUploadDialog';
import { Button } from "@/components/ui/button";

export interface UploadedImage {
  id: string;
  url: string;
  file: File;
}

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  images: UploadedImage[];
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
        <ImageUp className="w-3 h-3 text-[#33fea6] group-hover:text-[#64bf95] transition-colors" />
        <span>Upload</span>
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
