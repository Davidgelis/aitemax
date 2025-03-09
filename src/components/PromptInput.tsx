
import { useState, useEffect } from 'react';
import { UploadedImage } from '@/components/dashboard/ImageUploader';
import { ImageCarousel } from '@/components/dashboard/ImageCarousel';
import { X } from 'lucide-react';
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
}

const PromptInput = ({ 
  onSubmit, 
  placeholder = "Input your prompt...", 
  className = "",
  value,
  onChange,
  autoFocus = false,
  images = [],
  onImagesChange
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
    <form onSubmit={handleSubmit} className={`w-full max-w-2xl mx-auto ${className}`}>
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
          {/* Image upload button positioned inside the textarea at the top right */}
          <div className="absolute top-2 right-2 z-10">
            {onImagesChange && (
              <ImageUploader 
                onImagesChange={onImagesChange}
                images={images || []}
              />
            )}
          </div>
          
          <textarea
            value={inputValue}
            onChange={handleChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full h-32 p-4 rounded-xl resize-none outline-none focus:ring-2 focus:ring-accent/50 transition-all pt-10"
            style={{ 
              backgroundColor: "#041524",
              color: "#33fea6", 
              boxShadow: "0 0 20px rgba(51, 254, 166, 0.2)",
              border: "1px solid rgba(51, 254, 166, 0.3)",
              caretColor: "#33fea6"
            }}
          />
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
