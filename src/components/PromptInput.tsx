import { useState, useEffect, KeyboardEvent } from 'react';
import { UploadedImage } from '@/components/dashboard/types';
import { ImageCarousel } from '@/components/dashboard/ImageCarousel';
import { X, ListOrdered, List, Upload } from 'lucide-react';
import { ImageUploader } from '@/components/dashboard/ImageUploader';
import { Button } from "@/components/ui/button";

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
  onOpenUploadDialog?: () => void;
  dialogOpen?: boolean;
  setDialogOpen?: (open: boolean) => void;
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
  isLoading = false,
  onOpenUploadDialog,
  dialogOpen = false,
  setDialogOpen = () => {}
}: PromptInputProps) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>(undefined);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && textareaRef) {
      const cursorPosition = textareaRef.selectionStart;
      const text = inputValue;
      
      // Get the current line
      const lineStart = text.lastIndexOf('\n', cursorPosition - 1) + 1;
      const currentLine = text.substring(lineStart, cursorPosition);
      
      // Check if the current line starts with a bullet point
      const bulletMatch = currentLine.match(/^(\s*)•\s/);
      if (bulletMatch) {
        e.preventDefault();
        
        // If the current line is empty except for the bullet, remove the bullet
        if (currentLine.trim() === '•') {
          const newText = text.substring(0, lineStart) + text.substring(cursorPosition);
          setInputValue(newText);
          if (onChange) onChange(newText);
          
          // Set cursor position
          setTimeout(() => {
            if (textareaRef) {
              textareaRef.selectionStart = textareaRef.selectionEnd = lineStart;
            }
          }, 0);
        } else {
          // Add a new bullet point on the next line
          const indentation = bulletMatch[1] || '';
          const insertion = `\n${indentation}• `;
          const newText = text.substring(0, cursorPosition) + insertion + text.substring(cursorPosition);
          setInputValue(newText);
          if (onChange) onChange(newText);
          
          // Set cursor position after the new bullet point
          setTimeout(() => {
            if (textareaRef) {
              textareaRef.selectionStart = textareaRef.selectionEnd = cursorPosition + insertion.length;
            }
          }, 0);
        }
        return;
      }
      
      // Check if the current line starts with a numbered item
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      if (numberMatch) {
        e.preventDefault();
        
        // If the current line is empty except for the number, remove the numbering
        if (currentLine.trim() === `${numberMatch[2]}.`) {
          const newText = text.substring(0, lineStart) + text.substring(cursorPosition);
          setInputValue(newText);
          if (onChange) onChange(newText);
          
          // Set cursor position
          setTimeout(() => {
            if (textareaRef) {
              textareaRef.selectionStart = textareaRef.selectionEnd = lineStart;
            }
          }, 0);
        } else {
          // Add a new numbered item on the next line with incremented number
          const indentation = numberMatch[1] || '';
          const currentNumber = parseInt(numberMatch[2], 10);
          const nextNumber = currentNumber + 1;
          const insertion = `\n${indentation}${nextNumber}. `;
          const newText = text.substring(0, cursorPosition) + insertion + text.substring(cursorPosition);
          setInputValue(newText);
          if (onChange) onChange(newText);
          
          // Set cursor position after the new numbered item
          setTimeout(() => {
            if (textareaRef) {
              textareaRef.selectionStart = textareaRef.selectionEnd = cursorPosition + insertion.length;
            }
          }, 0);
        }
      }
    }
  };

  const insertBulletList = () => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const text = inputValue;
    
    // If text is selected, convert each line to bullet points
    if (start !== end) {
      const selectedText = text.substring(start, end);
      const lines = selectedText.split('\n');
      const bulletLines = lines.map(line => line.trim() ? `• ${line.trim()}` : line).join('\n');
      
      const newText = text.substring(0, start) + bulletLines + text.substring(end);
      setInputValue(newText);
      if (onChange) onChange(newText);
    } else {
      // If no text is selected, insert a bullet point at cursor position
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const indentation = text.substring(lineStart, start).match(/^\s*/)?.[0] || '';
      
      const newText = text.substring(0, start) + `• ` + text.substring(start);
      setInputValue(newText);
      if (onChange) onChange(newText);
      
      // Position cursor after the bullet point
      setTimeout(() => {
        if (textareaRef) {
          textareaRef.selectionStart = textareaRef.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const insertNumberedList = () => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const text = inputValue;
    
    // If text is selected, convert each line to numbered points
    if (start !== end) {
      const selectedText = text.substring(start, end);
      const lines = selectedText.split('\n');
      const numberedLines = lines.map((line, index) => 
        line.trim() ? `${index + 1}. ${line.trim()}` : line
      ).join('\n');
      
      const newText = text.substring(0, start) + numberedLines + text.substring(end);
      setInputValue(newText);
      if (onChange) onChange(newText);
    } else {
      // If no text is selected, insert a numbered point at cursor position
      const beforeCursor = text.substring(0, start);
      const afterCursor = text.substring(start);
      
      // Count existing numbered items to determine the next number
      const lines = beforeCursor.split('\n');
      let number = 1;
      
      // Match numbered list pattern (number followed by period and space)
      const regex = /^\d+\.\s/;
      
      // Check if we're already in a numbered list
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1].trim();
        
        if (regex.test(lastLine)) {
          // Extract the number from the previous line
          const match = lastLine.match(/^(\d+)\.\s/);
          if (match) {
            number = parseInt(match[1], 10) + 1;
          }
        }
      }
      
      const newText = text.substring(0, start) + `${number}. ` + text.substring(start);
      setInputValue(newText);
      if (onChange) onChange(newText);
      
      // Position cursor after the numbered point
      setTimeout(() => {
        if (textareaRef) {
          textareaRef.selectionStart = textareaRef.selectionEnd = start + `${number}. `.length;
        }
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full mx-auto ${className}`}>
      <div className="relative group">
        <div className="relative">
          <div className="flex items-center gap-2 mb-1 p-2 border-t border-x rounded-t-md border-[#e5e7eb] bg-[#fafafa]">
            <div className="flex gap-2">
              <button 
                type="button" 
                className="p-1 hover:bg-[#f0f0f0] rounded text-[#64bf95]"
                onClick={insertBulletList}
                title="Insert bullet list"
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                className="p-1 hover:bg-[#f0f0f0] rounded text-[#64bf95]"
                onClick={insertNumberedList}
                title="Insert numbered list"
              >
                <ListOrdered className="w-5 h-5" />
              </button>
            </div>
            
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            
            <div className="flex flex-1 items-center gap-2 overflow-x-auto">
              {images && images.length > 0 ? (
                images.map(image => (
                  <div key={image.id} className="relative group">
                    <img 
                      src={image.url} 
                      alt="Uploaded" 
                      className="w-8 h-8 object-cover rounded-md border border-[#33fea6]/30 cursor-pointer"
                      onClick={() => handleImageClick(image.id)}
                    />
                    <button
                      onClick={(e) => handleRemoveImage(image.id, e)}
                      className="absolute -top-1 -right-1 bg-[#041524] text-white rounded-full p-0.5 border border-[#33fea6]/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-gray-400 text-xs italic">No images uploaded</span>
              )}
            </div>
          </div>
          
          <textarea
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full h-[320px] p-4 rounded-b-xl resize-none outline-none transition-all"
            style={{ 
              backgroundColor: "#fafafa",
              color: "#545454", 
              border: "1px solid #e5e7eb",
              borderTop: "none"
            }}
            ref={(textarea) => setTextareaRef(textarea)}
          />
          
          <div className="hidden">
            {onImagesChange && (
              <ImageUploader 
                onImagesChange={onImagesChange}
                images={images || []}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
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
