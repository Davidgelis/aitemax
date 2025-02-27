
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
          className="w-full h-32 p-4 rounded-xl glass input-glow resize-none text-text placeholder:text-text/50"
          style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.05)" }}
        />
      </div>
    </form>
  );
};

export default PromptInput;

