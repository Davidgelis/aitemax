
import Logo from "@/components/Logo";
import PromptInput from "@/components/PromptInput";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handlePromptSubmit = (prompt: string) => {
    // Will implement in next iteration
    console.log("Prompt submitted:", prompt);
  };

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Aurora background overlay */}
      <div 
        className="fixed inset-0 bg-aurora-gradient bg-aurora animate-aurora opacity-15 pointer-events-none"
        style={{ zIndex: -1 }}
      />
      
      <nav className="fixed top-0 w-full max-w-7xl mx-auto p-6 flex justify-between items-center animate-fade-in">
        <button 
          className="aurora-button"
          onClick={() => navigate("/x-panel")}
        >
          X Panel
        </button>
        <button 
          className="aurora-button"
          onClick={handleAuthAction}
        >
          {user ? 'Logout' : 'Login'}
        </button>
      </nav>

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
            placeholder="Input your prompt to Aitema X..."
            className="w-full"
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
