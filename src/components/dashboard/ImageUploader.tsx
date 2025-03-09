
import { useState, useRef } from 'react';
import { ImageUp, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (images.length + files.length > maxImages) {
      toast({
        title: "Upload limit reached",
        description: `You can only upload a maximum of ${maxImages} images.`,
        variant: "destructive",
      });
      return;
    }
    
    const newImages: UploadedImage[] = [...images];
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed.",
          variant: "destructive",
        });
        return;
      }
      
      const url = URL.createObjectURL(file);
      newImages.push({
        id: `image-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url,
        file
      });
    });
    
    onImagesChange(newImages);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleRemoveImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    const updatedImages = images.filter(img => img.id !== id);
    onImagesChange(updatedImages);
  };
  
  return (
    <div className="flex flex-col">
      <div className="mb-2">
        <button
          onClick={handleClick}
          className="p-2 rounded-md border-2 border-[#64bf95] text-[#64bf95] hover:bg-[#64bf95]/10 transition-colors flex items-center gap-1"
          title="Upload images"
          disabled={images.length >= maxImages}
        >
          <ImageUp className="w-5 h-5" />
          <span className="text-sm">Upload Images</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          multiple
          onChange={handleChange}
        />
      </div>
      
      {images.length > 0 && (
        <div className="absolute top-2 right-2 flex flex-wrap gap-2 justify-end max-w-[200px]">
          {images.map(image => (
            <div key={image.id} className="relative group">
              <img 
                src={image.url} 
                alt="Uploaded" 
                className="w-12 h-12 object-cover rounded-md border border-[#64bf95] cursor-pointer"
              />
              <button
                onClick={() => handleRemoveImage(image.id)}
                className="absolute -top-2 -right-2 bg-[#041524] text-white rounded-full p-0.5 border border-[#64bf95] opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
