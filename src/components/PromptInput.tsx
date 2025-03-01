
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  className?: string;
  isSubmitting?: boolean;
}

const PromptInput = ({ 
  onSubmit, 
  placeholder = "Input your prompt...", 
  className = "",
  isSubmitting = false
}: PromptInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isSubmitting) {
      onSubmit(value.trim());
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
          disabled={isSubmitting}
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
          disabled={isSubmitting || !value.trim()}
          className="absolute right-4 bottom-4 px-6 py-2 rounded-lg transition-all duration-300 flex items-center justify-center"
          style={{ 
            background: "linear-gradient(-45deg, #041524, #084b49, #33fea6, #64bf95)",
            backgroundSize: "400% 400%",
            animation: "aurora 15s ease infinite",
            opacity: value.trim() ? 1 : 0.5,
            transform: `scale(${value.trim() ? 1 : 0.95})`,
          }}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <span className="text-white">Submit</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default PromptInput;
