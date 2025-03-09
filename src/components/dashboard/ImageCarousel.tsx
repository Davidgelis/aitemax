
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { UploadedImage } from './types';

interface ImageCarouselProps {
  images: UploadedImage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialImageId?: string;
}

export const ImageCarousel = ({ images, open, onOpenChange, initialImageId }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (initialImageId && open) {
      const index = images.findIndex(img => img.id === initialImageId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [initialImageId, images, open]);
  
  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };
  
  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };
  
  if (images.length === 0) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 bg-transparent border-none shadow-none backdrop-blur-md">
        <div className="relative w-full flex justify-center items-center">
          {/* Only show navigation arrows if we have more than one image */}
          {images.length > 1 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          <div className="max-h-[80vh] flex justify-center">
            <img 
              src={images[currentIndex]?.url} 
              alt="Carousel preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
          
          {/* Only show navigation arrows if we have more than one image */}
          {images.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors z-10"
            aria-label="Close carousel"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
