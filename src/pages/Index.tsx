
import Logo from "@/components/Logo";
import PromptInput from "@/components/PromptInput";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { KeyboardEvent } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePromptSubmit = (prompt: string) => {
    if (prompt.trim()) {
      // Store the prompt in sessionStorage so we can access it on the dashboard
      sessionStorage.setItem("redirectedPrompt", prompt);
      
      // Navigate to the dashboard
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/auth?returnUrl=/dashboard");
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // If user presses Enter without shift key, submit the prompt
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      handlePromptSubmit(textarea.value);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Aurora background overlay */}
      <div 
        className="fixed inset-0 bg-aurora-gradient bg-aurora animate-aurora opacity-15 pointer-events-none"
        style={{ zIndex: -1 }}
      />
      
      <main className="w-full max-w-4xl mx-auto flex flex-col items-center gap-12">
        <Logo />
        
        <p 
          className="text-center text-lg max-w-2xl animate-fade-in" 
          style={{ 
            animationDelay: "0.2s",
            background: "linear-gradient(-45deg, #041524, #084b49, #33fea6, #64bf95, white)",
            backgroundSize: "400% 400%",
            animation: "aurora 15s ease infinite",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}
        >
          Aitema X is humanity's unyielding vote in prompt engineering, a testament to our irreplaceable creativity.
        </p>

        <div className="w-full animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <PromptInput
            onSubmit={handlePromptSubmit}
            placeholder="Input your prompt to Aitema X... (Press Enter to continue)"
            className="w-full"
            onKeyDown={handleKeyDown}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
