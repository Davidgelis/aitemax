
import { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  className?: string;
}

const PromptInput = ({ onSubmit, placeholder = "Input your prompt...", className = "" }: PromptInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="relative group">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-32 p-4 rounded-xl resize-none"
          style={{ 
            backgroundColor: "#041524",
            color: "#33fea6", 
            boxShadow: "0 0 20px rgba(51, 254, 166, 0.2)",
            border: "1px solid rgba(51, 254, 166, 0.3)",
            caretColor: "#33fea6"
          }}
        />
      </div>
    </form>
  );
};

export default PromptInput;
