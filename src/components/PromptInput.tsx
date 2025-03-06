
import { useState, useEffect } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
}

const PromptInput = ({ 
  onSubmit, 
  placeholder = "Input your prompt...", 
  className = "",
  value,
  onChange,
  autoFocus = false
}: PromptInputProps) => {
  const [inputValue, setInputValue] = useState(value || "");
  
  // Update internal state when external value changes
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="relative group">
        <textarea
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full h-32 p-4 rounded-xl resize-none outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          style={{ 
            backgroundColor: "#041524",
            color: "#33fea6", 
            boxShadow: "0 0 20px rgba(51, 254, 166, 0.2)",
            border: "1px solid rgba(51, 254, 166, 0.3)",
            caretColor: "#33fea6"
          }}
        />
        <div className="absolute inset-0 rounded-xl pointer-events-none border border-transparent group-hover:border-accent/30 transition-all animate-aurora opacity-5"></div>
      </div>
    </form>
  );
};

export default PromptInput;
