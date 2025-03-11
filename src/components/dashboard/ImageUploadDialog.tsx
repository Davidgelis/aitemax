
import { useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { UploadedImage } from './types';
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
    
    // Process up to the remaining slots
    const processCount = Math.min(files.length, remainingSlots);
    
    for (let i = 0; i < processCount; i++) {
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
      // Keep existing images and add new ones
      const updatedImages = [...currentImages, ...newImages];
      onImagesUploaded(updatedImages);
      
      // If we've reached the maximum, close the dialog
      if (updatedImages.length >= maxImages) {
        onOpenChange(false);
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md border-0 shadow-lg rounded-lg mt-4">
        <div 
          className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg transition-colors ${
            isDragging ? 'border-[#33fea6] bg-[#33fea6]/5' : 'border-[#084b49]/30 bg-transparent'
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
              ? `Drag and drop an image here or click browse`
              : "You already have the maximum number of images uploaded"
            }
          </p>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleBrowseClick}
              disabled={remainingSlots <= 0}
              className="bg-[#33fea6] hover:bg-[#28d88c] text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Browse Files
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
              disabled={remainingSlots <= 0}
              multiple={remainingSlots > 1}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
