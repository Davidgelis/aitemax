import { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { UploadedImage } from '@/components/dashboard/types';
import { ImageCarousel } from '@/components/dashboard/ImageCarousel';
import { ListOrdered, List } from 'lucide-react';
import { ImageUploader } from '@/components/dashboard/ImageUploader';
import { Button } from "@/components/ui/button";

interface CustomStyles {
  textareaBackground?: string;
  textareaText?: string;
  paddingRight?: string;
}

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
  maxLength?: number;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  hideFormatting?: boolean;
  customStyles?: CustomStyles;
  textareaHeight?: string; // New prop for custom height
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
  setDialogOpen = () => {},
  maxLength = 3000,
  onKeyDown,
  hideFormatting = false,
  customStyles = {},
  textareaHeight = "320px", // Default height, can be overridden with prop
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
    
    // Only update if the new value is within the character limit
    if (newValue.length <= maxLength) {
      setInputValue(newValue);
      
      if (onChange) {
        onChange(newValue);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // If there's a custom key handler, call it first
    if (onKeyDown) {
      onKeyDown(e);
      // If the event was prevented, don't continue with default handling
      if (e.defaultPrevented) {
        return;
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey && textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const text = inputValue;
      
      const lineStart = text.lastIndexOf('\n', cursorPosition - 1) + 1;
      const currentLine = text.substring(lineStart, cursorPosition);
      
      const bulletMatch = currentLine.match(/^(\s*)•\s/);
      if (bulletMatch) {
        e.preventDefault();
        
        if (currentLine.trim() === '•' || currentLine.trim() === '• ') {
          const newText = text.substring(0, lineStart) + text.substring(cursorPosition);
          setInputValue(newText);
          if (onChange) onChange(newText);
          
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lineStart;
            }
          }, 0);
        } else {
          const indentation = bulletMatch[1] || '';
          const insertion = `\n${indentation}• `;
          const newText = text.substring(0, cursorPosition) + insertion + text.substring(cursorPosition);
          setInputValue(newText);
          if (onChange) onChange(newText);
          
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = cursorPosition + insertion.length;
            }
          }, 0);
        }
        return;
      }
      
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      if (numberMatch) {
        e.preventDefault();
        
        if (currentLine.trim() === `${numberMatch[2]}.` || currentLine.trim() === `${numberMatch[2]}. `) {
          const newText = text.substring(0, lineStart) + text.substring(cursorPosition);
          setInputValue(newText);
          if (onChange) onChange(newText);
          
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lineStart;
            }
          }, 0);
        } else {
          const indentation = numberMatch[1] || '';
          const currentNumber = parseInt(numberMatch[2], 10);
          const nextNumber = currentNumber + 1;
          const insertion = `\n${indentation}${nextNumber}. `;
          const newText = text.substring(0, cursorPosition) + insertion + text.substring(cursorPosition);
          setInputValue(newText);
          if (onChange) onChange(newText);
          
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = cursorPosition + insertion.length;
            }
          }, 0);
        }
      }
    }
  };

  const insertBulletList = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = inputValue;
    
    if (start !== end) {
      const selectedText = text.substring(start, end);
      const lines = selectedText.split('\n');
      const bulletLines = lines.map(line => line.trim() ? `• ${line.trim()}` : line).join('\n');
      
      const newText = text.substring(0, start) + bulletLines + text.substring(end);
      setInputValue(newText);
      if (onChange) onChange(newText);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + bulletLines.length;
        }
      }, 0);
    } else {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', start);
      const currentLine = text.substring(lineStart, lineEnd > -1 ? lineEnd : text.length);
      
      const bulletMatch = currentLine.match(/^(\s*)•\s/);
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      
      if (bulletMatch || numberMatch) {
        return;
      }
      
      const indentation = '';
      const contentBeforeCursor = text.substring(lineStart, start);
      const contentAfterCursor = text.substring(start, lineEnd > -1 ? lineEnd : text.length);
      
      if (contentBeforeCursor.trim() === '') {
        const newText = text.substring(0, lineStart) + `${indentation}• ${contentAfterCursor}` + text.substring(lineEnd > -1 ? lineEnd : text.length);
        setInputValue(newText);
        if (onChange) onChange(newText);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lineStart + indentation.length + 2;
          }
        }, 0);
      } else {
        const newText = text.substring(0, start) + `\n${indentation}• ` + text.substring(start);
        setInputValue(newText);
        if (onChange) onChange(newText);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indentation.length + 3;
          }
        }, 0);
      }
    }
  };

  const insertNumberedList = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = inputValue;
    
    if (start !== end) {
      const selectedText = text.substring(start, end);
      const lines = selectedText.split('\n');
      const numberedLines = lines.map((line, index) => 
        line.trim() ? `${index + 1}. ${line.trim()}` : line
      ).join('\n');
      
      const newText = text.substring(0, start) + numberedLines + text.substring(end);
      setInputValue(newText);
      if (onChange) onChange(newText);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + numberedLines.length;
        }
      }, 0);
    } else {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', start);
      const currentLine = text.substring(lineStart, lineEnd > -1 ? lineEnd : text.length);
      
      const bulletMatch = currentLine.match(/^(\s*)•\s/);
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      
      if (bulletMatch || numberMatch) {
        return;
      }
      
      const indentation = '';
      const contentBeforeCursor = text.substring(lineStart, start);
      const contentAfterCursor = text.substring(start, lineEnd > -1 ? lineEnd : text.length);
      
      if (contentBeforeCursor.trim() === '') {
        const newText = text.substring(0, lineStart) + `${indentation}1. ${contentAfterCursor}` + text.substring(lineEnd > -1 ? lineEnd : text.length);
        setInputValue(newText);
        if (onChange) onChange(newText);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lineStart + indentation.length + 3;
          }
        }, 0);
      } else {
        const newText = text.substring(0, start) + `\n${indentation}1. ` + text.substring(start);
        setInputValue(newText);
        if (onChange) onChange(newText);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indentation.length + 4;
          }
        }, 0);
      }
    }
  };

  // Reduce icon size by 20%
  const iconSize = 6.8; // Reduced from 8.5 (20% smaller)
  
  // Calculate character count percentage for the progress indicator
  const characterPercentage = Math.min((inputValue.length / maxLength) * 100, 100);
  const isNearLimit = inputValue.length > maxLength * 0.8;
  const isAtLimit = inputValue.length >= maxLength;

  // Determine text and background colors based on customStyles prop
  const textareaBackground = customStyles.textareaBackground || "#fafafa";
  const textareaText = customStyles.textareaText || "#545454";
  const textareaPaddingRight = customStyles.paddingRight || undefined;

  return (
    <form onSubmit={handleSubmit} className={`w-full mx-auto ${className}`}>
      <div className="relative group">
        <div className="relative">
          {!hideFormatting && (
            <div className="flex flex-wrap items-start justify-between gap-4 mb-1 p-3 border-t border-x rounded-t-md border-[#e5e7eb] bg-[#fafafa]">
              <div className="flex gap-4 items-start self-start">
                <button 
                  type="button" 
                  className="p-1 hover:bg-[#f0f0f0] rounded text-[#64bf95]"
                  onClick={insertBulletList}
                  title="Insert bullet list"
                >
                  <List style={{ width: `${iconSize * 4}px`, height: `${iconSize * 4}px` }} />
                </button>
                <button 
                  type="button" 
                  className="p-1 hover:bg-[#f0f0f0] rounded text-[#64bf95]"
                  onClick={insertNumberedList}
                  title="Insert numbered list"
                >
                  <ListOrdered style={{ width: `${iconSize * 4}px`, height: `${iconSize * 4}px` }} />
                </button>
              </div>
              
              {/* Character counter */}
              <div className={`text-xs flex items-center gap-2 ${isNearLimit ? (isAtLimit ? 'text-red-500' : 'text-amber-500') : 'text-gray-500'}`}>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${characterPercentage}%` }}
                  ></div>
                </div>
                <span>{inputValue.length}/{maxLength}</span>
              </div>
            </div>
          )}
          
          <textarea
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`w-full p-4 resize-none outline-none transition-all text-lg placeholder:text-gray-400 ${!hideFormatting ? 'rounded-b-xl' : 'rounded-xl'}`}
            style={{ 
              backgroundColor: textareaBackground,
              color: textareaText,
              border: "1px solid #e5e7eb",
              borderTop: hideFormatting ? "1px solid #e5e7eb" : "none",
              fontSize: "1.2rem",
              height: textareaHeight, // Use the provided height or default
              paddingRight: textareaPaddingRight // Apply right padding to avoid text being hidden by FAB
            }}
            ref={textareaRef}
            maxLength={maxLength}
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
