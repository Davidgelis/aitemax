
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handlePromptTester = () => {
    navigate("/dashboard");
  };

  const animatedBorderStyle = {
    background: `
      linear-gradient(90deg, 
        #041524 0%, 
        #084b49 25%, 
        #33fea6 50%, 
        #64bf95 75%, 
        white 100%
      )
      border-box
    `,
    backgroundSize: "300% 300%",
    animation: "borderGradient 4s ease infinite",
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <header className="p-4 flex justify-between items-center">
        <Logo />
        <UserProfile />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 space-y-12">
        <div 
          className="p-[2px] rounded-2xl"
          style={animatedBorderStyle}
        >
          <div className="bg-white rounded-2xl p-8 md:p-12 max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-[#545454] text-center">
              Aitema X AI Prompt Creator
            </h1>
            <p className="text-lg md:text-xl text-[#545454] mb-8 text-center">
              Easily create and enhance your AI prompts for better results
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-[#084b49] hover:bg-[#041524] text-white px-8 py-6 text-lg"
                onClick={handleGetStarted}
              >
                {user ? "Go to Dashboard" : "Get Started"}
              </Button>
              <Button 
                variant="outline" 
                className="border-[#545454] text-[#545454] px-8 py-6 text-lg"
                onClick={handlePromptTester}
              >
                Prompt Tester
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          <FeatureCard 
            title="Analyze"
            description="Understand what makes your prompts effective and where they can be improved"
          />
          <FeatureCard 
            title="Enhance"
            description="Add clarity, context, and structure to your prompts for better AI responses"
          />
          <FeatureCard 
            title="Save"
            description="Store your perfected prompts for future use and continuous improvement"
          />
        </div>
      </main>

      <style jsx>{`
        @keyframes borderGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

const FeatureCard = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-[#545454] shadow-sm">
      <h3 className="text-xl font-semibold mb-3 text-[#545454]">{title}</h3>
      <p className="text-[#545454]">{description}</p>
    </div>
  );
};

export default Index;
