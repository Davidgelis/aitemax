
import { useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { UploadedImage } from './ImageUploader';
import { Upload, ImagePlus } from 'lucide-react';

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImagesUploaded: (images: UploadedImage[]) => void;
  maxImages: number;
  currentImages: UploadedImage[];
}

export const ImageUploadDialog = ({
  open,
  onOpenChange,
  onImagesUploaded,
  maxImages,
  currentImages
}: ImageUploadDialogProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const remainingSlots = maxImages - currentImages.length;
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  const handleFiles = (files: FileList) => {
    const newImages: UploadedImage[] = [];
    
    // Only process up to the remaining slots
    const filesToProcess = Math.min(files.length, remainingSlots);
    
    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newImages.push({
          id: `image-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url,
          file
        });
      }
    }
    
    if (newImages.length > 0) {
      onImagesUploaded([...currentImages, ...newImages]);
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md border border-[#084b49]/30">
        <div 
          className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl transition-colors ${
            isDragging ? 'border-[#33fea6] bg-[#33fea6]/5' : 'border-[#084b49] bg-transparent'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <ImagePlus 
            className={`w-16 h-16 mb-4 ${isDragging ? 'text-[#33fea6]' : 'text-[#084b49]'}`}
          />
          
          <p className="text-center mb-6 text-[#545454]">
            {remainingSlots > 0 
              ? `Drag and drop images here (${remainingSlots} remaining)`
              : "Maximum number of images reached"
            }
          </p>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleBrowseClick}
              disabled={remainingSlots <= 0}
              className="aurora-button flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Browse
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple
              onChange={handleFileChange}
              disabled={remainingSlots <= 0}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
