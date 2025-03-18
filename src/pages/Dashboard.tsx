import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AIModel } from "@/components/dashboard/types";
import { UserSidebar } from "@/components/dashboard/UserSidebar";
import { StepController } from "@/components/dashboard/StepController";
import { usePromptState } from "@/hooks/usePromptState";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

const fallbackModels = [
  {
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's most advanced multimodal model combining vision and language capabilities.",
    strengths: ["Multimodal capabilities", "State-of-the-art performance", "Handles complex reasoning", "Faster processing than GPT-4"],
    limitations: ["May produce convincing but incorrect information", "Limited knowledge cutoff", "Not specialized for specific domains"]
  },
  {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Anthropic's most capable model with excellent performance across reasoning, math, and coding tasks.",
    strengths: ["Strong reasoning abilities", "Code generation", "Less tendency to hallucinate", "Good at following instructions"],
    limitations: ["Higher latency than smaller models", "Less widely available than some competitors", "Limited context window"]
  },
  {
    name: "Llama 3",
    provider: "Meta",
    description: "Meta's latest open-source large language model with improved reasoning and instruction following.",
    strengths: ["Open-source architecture", "Strong performance for its size", "Active community development", "Multiple size variants"],
    limitations: ["Smaller context window than some competitors", "Less training data than closed models", "May require more explicit prompting"]
  },
  {
    name: "GPT-4o mini",
    provider: "OpenAI",
    description: "A smaller, faster, and more cost-effective version of GPT-4o.",
    strengths: ["Faster response time", "Lower cost", "Good balance of performance and efficiency", "Multimodal capabilities"],
    limitations: ["Less capable than full GPT-4o on complex tasks", "Reduced reasoning ability compared to larger models", "Limited context window"]
  },
  {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Google's advanced multimodal model with extended context window and improved reasoning.",
    strengths: ["Very large context window", "Strong multimodal understanding", "Good reasoning capabilities", "Efficient processing"],
    limitations: ["May struggle with certain specialized domains", "Potential for generating incorrect information", "Less tested than some alternatives"]
  }
];

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [selectedCognitive, setSelectedCognitive] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const promptState = usePromptState(user);
  
  const filteredPrompts = promptState.savedPrompts.filter(
    (prompt) => prompt.title.toLowerCase().includes(promptState.searchTerm.toLowerCase())
  );
  
  useEffect(() => {
    const saveDraftBeforeNavigate = (nextPath: string) => {
      if (nextPath !== location.pathname && promptState.promptText && !promptState.isViewingSavedPrompt) {
        promptState.saveDraft();
      }
    };

    // For regular navigation
    const handleRouteChange = (e: PopStateEvent) => {
      const nextPath = window.location.pathname;
      if (nextPath !== location.pathname) {
        saveDraftBeforeNavigate(nextPath);
      }
    };

    // Add event listeners
    window.addEventListener('popstate', handleRouteChange);

    // Intercept Link navigation
    const originalPushState = window.history.pushState;
    window.history.pushState = function() {
      const nextPath = arguments[2] as string;
      saveDraftBeforeNavigate(nextPath);
      return originalPushState.apply(this, arguments as any);
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.history.pushState = originalPushState;
    };
  }, [location.pathname, promptState.promptText, promptState.isViewingSavedPrompt, promptState.saveDraft]);
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleCognitiveToggle = (id: string) => {
    setSelectedCognitive(currentSelected => currentSelected === id ? null : id);
    
    if (selectedCognitive === null) {
      toast({
        title: "Cognitive Model Activated",
        description: "Your prompts will now undergo an additional precision-driven refinement",
      });
    }
  };

  useEffect(() => {
    if (user) {
      promptState.fetchSavedPrompts();
    }
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto min-h-screen flex flex-col items-center justify-center gap-8">
            <StepController 
              user={user} 
              selectedModel={selectedModel} 
              setSelectedModel={setSelectedModel}
              selectedCognitive={selectedCognitive}
              handleCognitiveToggle={handleCognitiveToggle}
              promptState={promptState}
            />
          </div>
        </main>

        <UserSidebar 
          user={user}
          savedPrompts={promptState.savedPrompts}
          filteredPrompts={filteredPrompts}
          searchTerm={promptState.searchTerm}
          setSearchTerm={promptState.setSearchTerm}
          isLoadingPrompts={promptState.isLoadingPrompts}
          handleNewPrompt={promptState.handleNewPrompt}
          handleDeletePrompt={promptState.handleDeletePrompt}
          handleDuplicatePrompt={promptState.handleDuplicatePrompt}
          handleRenamePrompt={promptState.handleRenamePrompt}
          loadSavedPrompt={promptState.loadSavedPrompt}
          drafts={promptState.drafts}
          isLoadingDrafts={promptState.isLoadingDrafts}
          loadDraft={promptState.loadSelectedDraft}
          handleDeleteDraft={promptState.handleDeleteDraft}
          currentDraftId={promptState.currentDraftId}
        />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
