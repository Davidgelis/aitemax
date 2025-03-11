
import { useState, useEffect } from 'react';
import { UploadedImage } from '@/components/dashboard/types';
import { ImageCarousel } from '@/components/dashboard/ImageCarousel';
import { X, ListOrdered, List } from 'lucide-react';
import { ImageUploader } from '@/components/dashboard/ImageUploader';

interface PromptInputProps {
  onSubmit: (prompt: string, images?: UploadedImage[]) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
  images?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
  isLoading?: boolean;
}

const PromptInput = ({ 
  onSubmit, 
  placeholder = "Start by typing your prompt. For example: 'Create an email template for customer onboarding' or 'Write a prompt for generating code documentation'", 
  className = "",
  value,
  onChange,
  autoFocus = false,
  images = [],
  onImagesChange,
  isLoading = false
}: PromptInputProps) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim(), images);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleImageClick = (imageId: string) => {
    setSelectedImageId(imageId);
    setCarouselOpen(true);
  };
  
  const handleRemoveImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent carousel from opening when clicking delete
    
    if (!onImagesChange) return;
    
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    const updatedImages = images.filter(img => img.id !== id);
    onImagesChange(updatedImages);
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full mx-auto ${className}`}>
      <div className="relative group">
        {/* Display uploaded images above the textarea */}
        {images && images.length > 0 && (
          <div className="absolute top-[-56px] right-0 flex flex-wrap gap-2 z-10 max-w-[80%] justify-end">
            {images.map(image => (
              <div key={image.id} className="relative group">
                <img 
                  src={image.url} 
                  alt="Uploaded" 
                  className="w-14 h-14 object-cover rounded-md border border-[#33fea6]/30 cursor-pointer"
                  onClick={() => handleImageClick(image.id)}
                />
                <button
                  onClick={(e) => handleRemoveImage(image.id, e)}
                  className="absolute -top-2 -right-2 bg-[#041524] text-white rounded-full p-0.5 border border-[#33fea6]/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="relative">
          {/* Formatting buttons */}
          <div className="flex gap-2 mb-1 p-2 border-t border-x rounded-t-md border-[#e5e7eb] bg-[#fafafa]">
            <button type="button" className="p-1 hover:bg-[#f0f0f0] rounded text-[#545454]">
              <List className="w-5 h-5" />
            </button>
            <button type="button" className="p-1 hover:bg-[#f0f0f0] rounded text-[#545454]">
              <ListOrdered className="w-5 h-5" />
            </button>
          </div>
          
          <textarea
            value={inputValue}
            onChange={handleChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full h-[320px] p-4 rounded-b-xl resize-none outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            style={{ 
              backgroundColor: "#fafafa",
              color: "#545454", 
              border: "1px solid #e5e7eb",
              borderTop: "none"
            }}
          />
          
          <div className="hidden">
            {onImagesChange && (
              <ImageUploader 
                onImagesChange={onImagesChange}
                images={images || []}
              />
            )}
          </div>
        </div>
      </div>
      
      <ImageCarousel 
        images={images}
        open={carouselOpen}
        onOpenChange={setCarouselOpen}
        initialImageId={selectedImageId}
      />
    </form>
  );
};

export default PromptInput;
