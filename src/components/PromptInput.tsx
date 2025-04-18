import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Upload, X } from "lucide-react";
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';

interface PromptInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  className?: string;
  images?: any[];
  onImagesChange?: (images: any[]) => void;
  isLoading?: boolean;
  onOpenUploadDialog?: () => void;
  dialogOpen?: boolean;
  setDialogOpen?: (open: boolean) => void;
  maxLength?: number;
  placeholder?: string;
}

const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  className,
  images = [],
  onImagesChange,
  isLoading,
  onOpenUploadDialog,
  dialogOpen,
  setDialogOpen,
  maxLength = 3000,
  placeholder = "Enter your prompt..."
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { currentLanguage } = useLanguage();
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleSubmit = () => {
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, isExpanded]);

  return (
    <div className={`flex flex-col rounded-md ${className}`}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="resize-none border rounded-md focus:outline-none focus:ring focus:border-primary"
          maxLength={maxLength}
        />
      </div>
      <div className="flex justify-end mt-2">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="ml-2"
        >
          {isLoading ? <Send className="mr-2 h-4 w-4 animate-pulse" /> : <Send className="mr-2 h-4 w-4" />}
          {t.prompts.analyze}
        </Button>
      </div>
    </div>
  );
};

export default PromptInput;
