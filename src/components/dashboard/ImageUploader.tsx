
import { useState, useRef } from 'react';
import { ImageUp, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImageUploadDialog } from './ImageUploadDialog';

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

export const ImageUploader = ({ onImagesChange, maxImages = 5, images }: ImageUploaderProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  const handleImagesUploaded = (newImages: UploadedImage[]) => {
    if (newImages.length > maxImages) {
      toast({
        title: "Upload limit reached",
        description: `You can only upload a maximum of ${maxImages} images.`,
        variant: "destructive",
      });
      return;
    }
    
    onImagesChange(newImages);
  };
  
  const handleRemoveImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the carousel from opening when clicking delete
    
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    const updatedImages = images.filter(img => img.id !== id);
    onImagesChange(updatedImages);
  };
  
  const handleImageClick = (id: string) => {
    setSelectedImageId(id);
    setCarouselOpen(true);
  };
  
  return (
    <div className="flex flex-col">
      <div className="mb-2">
        <button
          onClick={() => setDialogOpen(true)}
          className="p-2 rounded-md border-2 border-[#64bf95] text-[#64bf95] hover:bg-[#64bf95]/10 transition-colors flex items-center gap-1"
          title="Upload images"
          disabled={images.length >= maxImages}
        >
          <ImageUp className="w-5 h-5" />
          <span className="text-sm">Upload Images</span>
        </button>
      </div>
      
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
