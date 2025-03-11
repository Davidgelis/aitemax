
import { useState, useEffect, KeyboardEvent, useRef } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  
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

  // Similar to Google Docs list handling
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const text = inputValue;
      
      // Get the current line
      const lineStart = text.lastIndexOf('\n', cursorPosition - 1) + 1;
      const currentLine = text.substring(lineStart, cursorPosition);
      
      // Check if the current line starts with a bullet point
      const bulletMatch = currentLine.match(/^(\s*)•\s/);
      if (bulletMatch) {
        e.preventDefault();
        
        // If the current line is empty except for the bullet, remove the bullet (break out of list)
        if (currentLine.trim() === '•' || currentLine.trim() === '• ') {
          const newText = text.substring(0, lineStart) + text.substring(cursorPosition);
          setInputValue(newText);
          if (onChange) onChange(newText);
          
          // Set cursor position
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lineStart;
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
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = cursorPosition + insertion.length;
            }
          }, 0);
        }
        return;
      }
      
      // Check if the current line starts with a numbered item
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      if (numberMatch) {
        e.preventDefault();
        
        // If the current line is empty except for the number, remove the numbering (break out of list)
        if (currentLine.trim() === `${numberMatch[2]}.` || currentLine.trim() === `${numberMatch[2]}. `) {
          const newText = text.substring(0, lineStart) + text.substring(cursorPosition);
          setInputValue(newText);
          if (onChange) onChange(newText);
          
          // Set cursor position
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lineStart;
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
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = cursorPosition + insertion.length;
            }
          }, 0);
        }
      }
    }
  };

  // Improved bullet list insertion with Google Docs-like behavior
  const insertBulletList = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = inputValue;
    
    // If text is selected, convert each line to bullet points
    if (start !== end) {
      const selectedText = text.substring(start, end);
      const lines = selectedText.split('\n');
      const bulletLines = lines.map(line => line.trim() ? `• ${line.trim()}` : line).join('\n');
      
      const newText = text.substring(0, start) + bulletLines + text.substring(end);
      setInputValue(newText);
      if (onChange) onChange(newText);
      
      // Position cursor at the end of the converted text
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + bulletLines.length;
        }
      }, 0);
    } else {
      // If no text is selected, check if we're currently in a list
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', start);
      const currentLine = text.substring(lineStart, lineEnd > -1 ? lineEnd : text.length);
      
      // Check if we're already in a list
      const bulletMatch = currentLine.match(/^(\s*)•\s/);
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      
      if (bulletMatch || numberMatch) {
        // Already in a list, don't add a bullet
        return;
      }
      
      // Insert bullet at current position or beginning of line
      const indentation = '';
      const contentBeforeCursor = text.substring(lineStart, start);
      const contentAfterCursor = text.substring(start, lineEnd > -1 ? lineEnd : text.length);
      
      // If at beginning of line or line just has whitespace before cursor
      if (contentBeforeCursor.trim() === '') {
        const newText = text.substring(0, lineStart) + `${indentation}• ${contentAfterCursor}` + text.substring(lineEnd > -1 ? lineEnd : text.length);
        setInputValue(newText);
        if (onChange) onChange(newText);
        
        // Position cursor after the bullet
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lineStart + indentation.length + 2;
          }
        }, 0);
      } else {
        // Insert bullet at cursor position
        const newText = text.substring(0, start) + `\n${indentation}• ` + text.substring(start);
        setInputValue(newText);
        if (onChange) onChange(newText);
        
        // Position cursor after the bullet
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indentation.length + 3;
          }
        }, 0);
      }
    }
  };

  // Improved numbered list insertion with Google Docs-like behavior
  const insertNumberedList = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
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
      
      // Position cursor at the end of the converted text
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + numberedLines.length;
        }
      }, 0);
    } else {
      // If no text is selected, check if we're currently in a list
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', start);
      const currentLine = text.substring(lineStart, lineEnd > -1 ? lineEnd : text.length);
      
      // Check if we're already in a list
      const bulletMatch = currentLine.match(/^(\s*)•\s/);
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      
      if (bulletMatch || numberMatch) {
        // Already in a list, don't add a number
        return;
      }
      
      // Insert number at current position
      const indentation = '';
      const contentBeforeCursor = text.substring(lineStart, start);
      const contentAfterCursor = text.substring(start, lineEnd > -1 ? lineEnd : text.length);
      
      // If at beginning of line or line just has whitespace before cursor
      if (contentBeforeCursor.trim() === '') {
        const newText = text.substring(0, lineStart) + `${indentation}1. ${contentAfterCursor}` + text.substring(lineEnd > -1 ? lineEnd : text.length);
        setInputValue(newText);
        if (onChange) onChange(newText);
        
        // Position cursor after the number
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lineStart + indentation.length + 3;
          }
        }, 0);
      } else {
        // Insert number at cursor position
        const newText = text.substring(0, start) + `\n${indentation}1. ` + text.substring(start);
        setInputValue(newText);
        if (onChange) onChange(newText);
        
        // Position cursor after the number
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indentation.length + 4;
          }
        }, 0);
      }
    }
  };

  // Define larger icon size (30% bigger)
  const iconSize = 8.5; // Increasing size by another 30%

  return (
    <form onSubmit={handleSubmit} className={`w-full mx-auto ${className}`}>
      <div className="relative group">
        <div className="relative">
          <div className="flex items-center gap-4 mb-1 p-6 border-t border-x rounded-t-md border-[#e5e7eb] bg-[#fafafa]">
            {/* Formatting tools on the left */}
            <div className="flex gap-4">
              <button 
                type="button" 
                className="p-1.5 hover:bg-[#f0f0f0] rounded text-[#64bf95]"
                onClick={insertBulletList}
                title="Insert bullet list"
              >
                <List style={{ width: `${iconSize * 4}px`, height: `${iconSize * 4}px` }} />
              </button>
              <button 
                type="button" 
                className="p-1.5 hover:bg-[#f0f0f0] rounded text-[#64bf95]"
                onClick={insertNumberedList}
                title="Insert numbered list"
              >
                <ListOrdered style={{ width: `${iconSize * 4}px`, height: `${iconSize * 4}px` }} />
              </button>
            </div>
            
            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            
            {/* Image previews aligned to the right */}
            <div className="flex flex-1 justify-end items-center gap-5 overflow-x-auto py-3 px-2">
              {images && images.length > 0 ? (
                images.map(image => (
                  <div key={image.id} className="relative group" style={{ marginTop: '5px', marginBottom: '5px' }}>
                    <img 
                      src={image.url} 
                      alt="Uploaded" 
                      className="object-cover rounded-md border border-[#33fea6]/30 cursor-pointer"
                      onClick={() => handleImageClick(image.id)}
                      style={{ width: '85px', height: '85px' }}
                    />
                    <button
                      onClick={(e) => handleRemoveImage(image.id, e)}
                      className="absolute -top-5 -right-5 bg-[#041524] text-white rounded-full p-2 border border-[#33fea6]/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <X className="w-5 h-5" />
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
            ref={textareaRef}
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
