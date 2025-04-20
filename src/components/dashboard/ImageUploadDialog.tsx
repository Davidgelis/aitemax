
import { useState, useCallback, useRef, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadedImage } from './types';
import { v4 as uuidv4 } from 'uuid';
import { ImagePlus, X, Info, Upload } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (!e.target.files?.length) return;
    
    setIsProcessing(true);
    
    try {
      const files = Array.from(e.target.files);
      
      // Validate file types
      const invalidFile = files.find(file => !file.type.startsWith('image/'));
      if (invalidFile) {
        setError('Only image files are allowed');
        setIsProcessing(false);
        return;
      }
      
      // Check if max images would be exceeded
      const totalImages = currentImages.length + files.length;
      if (totalImages > maxImages) {
        setError(`Maximum ${maxImages} image${maxImages === 1 ? '' : 's'} allowed`);
        setIsProcessing(false);
        return;
      }
      
      // Process files
      const newImages: UploadedImage[] = [];
      
      for (const file of files) {
        try {
          const imageId = uuidv4();
          const objectUrl = URL.createObjectURL(file);
          
          // Convert to base64
          const base64 = await convertToBase64(file);
          
          newImages.push({
            id: imageId,
            url: objectUrl,
            file,
            base64
          });
        } catch (error) {
          console.error('Error processing image:', error);
          setError('Error processing one of the images');
        }
      }
      
      if (newImages.length > 0) {
        const updatedImages = [...currentImages, ...newImages];
        onImagesUploaded(updatedImages);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error handling file upload:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [currentImages, maxImages, onImagesUploaded, onOpenChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    if (!e.dataTransfer.files?.length) return;
    
    setIsProcessing(true);
    
    try {
      const files = Array.from(e.dataTransfer.files);
      
      // Filter image files
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length === 0) {
        setError('No valid image files found');
        setIsProcessing(false);
        return;
      }
      
      // Check if max images would be exceeded
      const totalImages = currentImages.length + imageFiles.length;
      if (totalImages > maxImages) {
        setError(`Maximum ${maxImages} image${maxImages === 1 ? '' : 's'} allowed`);
        setIsProcessing(false);
        return;
      }
      
      // Process files
      const newImages: UploadedImage[] = [];
      
      for (const file of imageFiles) {
        try {
          const imageId = uuidv4();
          const objectUrl = URL.createObjectURL(file);
          
          // Convert to base64
          const base64 = await convertToBase64(file);
          
          newImages.push({
            id: imageId,
            url: objectUrl,
            file,
            base64
          });
        } catch (error) {
          console.error('Error processing image:', error);
          setError('Error processing one of the images');
        }
      }
      
      if (newImages.length > 0) {
        const updatedImages = [...currentImages, ...newImages];
        onImagesUploaded(updatedImages);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error handling file drop:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [currentImages, maxImages, onImagesUploaded, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-[#545454]">Upload Image</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging 
                ? 'border-[#084b49] bg-[#084b49]/5' 
                : 'border-[#e5e7eb] hover:border-[#084b49]/50 hover:bg-[#084b49]/5'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center p-4">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#084b49]"></div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-[#084b49] mb-2" />
                  <p className="text-sm font-medium text-[#545454]">
                    {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-[#545454]/70 mt-1">
                    PNG, JPG, or GIF up to 5MB
                  </p>
                </>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              multiple={maxImages > 1}
            />
          </div>
          
          {error && (
            <div className="mt-2 text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-4 text-xs text-[#545454]/80">
            <Info size={14} className="flex-shrink-0" />
            <p>
              Images will be analyzed using GPT-4.1 to extract content, style and context information. 
              This helps create more precise and relevant prompts based on visual elements.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-transparent hover:bg-gray-100 text-[#545454]"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
