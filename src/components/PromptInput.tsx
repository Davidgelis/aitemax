
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
        <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent opacity-20 rounded-xl animate-pulse"></div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-32 p-4 rounded-xl resize-none relative"
          style={{ 
            backgroundColor: "#041524",
            color: "#33fea6", 
            boxShadow: "0 0 20px rgba(51, 254, 166, 0.2)",
            border: "1px solid rgba(51, 254, 166, 0.3)",
            caretColor: "#33fea6"
          }}
        />
        <button 
          type="submit" 
          className="absolute bottom-3 right-3 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors"
          style={{
            boxShadow: "0 0 10px rgba(51, 254, 166, 0.3)",
          }}
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default PromptInput;
