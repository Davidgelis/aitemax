
import Logo from "@/components/Logo";
import PromptInput from "@/components/PromptInput";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const handlePromptSubmit = (prompt: string) => {
    // Will implement in next iteration
    console.log("Prompt submitted:", prompt);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <nav className="fixed top-0 w-full max-w-7xl mx-auto p-6 flex justify-between items-center animate-fade-in">
        <button 
          className="aurora-button"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>
        <button className="aurora-button">
          Login
        </button>
      </nav>

      <main className="w-full max-w-4xl mx-auto flex flex-col items-center gap-12">
        <Logo />
        
        <p className="text-center text-lg text-text/80 max-w-2xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Aitema X is humanity's unyielding vote in prompt engineering, a testament to our irreplaceable creativity.
        </p>

        <div className="w-full animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <PromptInput
            onSubmit={handlePromptSubmit}
            placeholder="Input your prompt to Aitema X..."
            className="w-full"
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
