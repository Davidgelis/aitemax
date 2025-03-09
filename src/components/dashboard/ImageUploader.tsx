
import { useState } from 'react';
import { ImageUp } from 'lucide-react';
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
      return;
    }
    
    onImagesChange(newImages);
  };
  
  return (
    <div className="flex flex-col">
      <div className="mb-2">
        <button
          onClick={() => setDialogOpen(true)}
          className="px-3 py-2 rounded-md border-2 border-[#33fea6] text-[#545454] hover:bg-[#33fea6]/10 transition-colors flex items-center gap-2"
          title="Upload image"
          disabled={images.length >= maxImages}
        >
          <ImageUp className="w-5 h-5 text-[#33fea6]" />
          <span className="text-sm font-medium">Upload Image</span>
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
