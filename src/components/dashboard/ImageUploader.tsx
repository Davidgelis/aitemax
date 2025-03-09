
import { useState } from 'react';
import { ImageUp } from 'lucide-react';
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

export const ImageUploader = ({ onImagesChange, maxImages = 1, images }: ImageUploaderProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleImagesUploaded = (newImages: UploadedImage[]) => {
    if (newImages.length > maxImages) {
      toast({
        title: "Upload limit reached",
        description: `You can only upload a maximum of ${maxImages} image.`,
        variant: "destructive",
      });
      return;
    }
    
    onImagesChange(newImages);
  };
  
  return (
    <div className="flex flex-col">
      <div className="mb-2">
        <button
          onClick={() => setDialogOpen(true)}
          className="p-2 rounded-md border-2 border-[#64bf95] text-[#64bf95] hover:bg-[#64bf95]/10 transition-colors flex items-center gap-1"
          title="Upload image"
          disabled={images.length >= maxImages}
        >
          <ImageUp className="w-5 h-5" />
          <span className="text-sm">Upload Image</span>
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
