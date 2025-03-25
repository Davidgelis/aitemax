import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AIModel } from "@/components/dashboard/types";
import { UserSidebar } from "@/components/dashboard/UserSidebar";
import { StepController } from "@/components/dashboard/StepController";
import { usePromptState } from "@/hooks/usePromptState";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import XPanelButton from "@/components/dashboard/XPanelButton";

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
    limitations: ["Smaller context window than some competitors", "Less training data than closed models", "Less training data than closed models", "May require more explicit prompting"]
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const promptState = usePromptState(user);
  
  const filteredPrompts = promptState.savedPrompts.filter(
    (prompt) => prompt.title.toLowerCase().includes(promptState.searchTerm.toLowerCase())
  );
  
  // Enhanced logging for better prompt tracking
  useEffect(() => {
    if (promptState.savedPrompts.length > 0) {
      console.log(`User has ${promptState.savedPrompts.length} saved prompts`, 
        promptState.savedPrompts.map(p => ({id: p.id, title: p.title})));
    }
    
    if (promptState.drafts.length > 0) {
      console.log(`User has ${promptState.drafts.length} draft prompts`,
        promptState.drafts.map(d => ({id: d.id, title: d.title})));
    }
  }, [promptState.savedPrompts, promptState.drafts]);
  
  useEffect(() => {
    const saveDraftBeforeNavigate = (nextPath: string) => {
      // Only save draft if:
      // 1. We're navigating away from the current page
      // 2. There is prompt text
      // 3. We're not viewing a saved prompt
      // 4. We're on step 2 (not step 1 or 3)
      if (nextPath !== location.pathname && 
          promptState.promptText && 
          !promptState.isViewingSavedPrompt && 
          promptState.currentStep === 2) {
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
  }, [location.pathname, promptState.promptText, promptState.isViewingSavedPrompt, promptState.saveDraft, promptState.currentStep]);
  
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

  // Fetch user profile data when user changes
  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user profile:", error);
        } else if (profileData) {
          setUserProfile(profileData);
        }
      };
      
      fetchUserProfile();
      promptState.fetchSavedPrompts();
    }
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <XPanelButton />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto min-h-screen flex flex-col items-center justify-center gap-8">
            <StepController 
              user={user} 
              selectedModel={selectedModel} 
              setSelectedModel={setSelectedModel}
              promptState={promptState}
            />
          </div>
        </main>

        <UserSidebar 
          user={user}
          userProfile={userProfile}
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
