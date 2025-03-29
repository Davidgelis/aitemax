
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
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Save, RefreshCw } from "lucide-react";

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
  const { session, loading: authLoading, sessionExpiresAt, refreshSession } = useAuth();
  const [sessionTimer, setSessionTimer] = useState<string>("");
  
  // Create promptState after getting auth state
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
  
  // Update auth user when session changes
  useEffect(() => {
    if (session) {
      setUser(session.user);
    } else if (!authLoading) {
      setUser(null);
    }
  }, [session, authLoading]);
  
  // Set up session timer display
  useEffect(() => {
    if (!sessionExpiresAt) return;
    
    const updateTimer = () => {
      const now = new Date();
      const timeLeft = sessionExpiresAt.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setSessionTimer("Expired");
        return;
      }
      
      // Format time left as MM:SS
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      setSessionTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    // Update timer immediately
    updateTimer();
    
    // Set up interval to update timer every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [sessionExpiresAt]);
  
  useEffect(() => {
    const saveDraftBeforeNavigate = (nextPath: string) => {
      // Only save draft if:
      // 1. We're navigating away from the current page
      // 2. There is prompt text
      // 3. We're not viewing a saved prompt
      // 4. We're on step 2 (not step 1 or 3)
      // 5. There are unsaved changes (isDirty)
      if (nextPath !== location.pathname && 
          promptState.promptText && 
          !promptState.isViewingSavedPrompt && 
          promptState.currentStep === 2 &&
          promptState.isDirty) {
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
  }, [location.pathname, promptState]);
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Error getting session:", error);
        toast({
          title: "Session Error",
          description: "There was a problem connecting to your account. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    };
    
    getUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast]);

  // Fetch user profile data when user changes
  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        try {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", user.id)
            .single();
          
          if (error) {
            console.error("Error fetching user profile:", error);
            // Handle gracefully - still allow usage without profile
          } else if (profileData) {
            setUserProfile(profileData);
          }
        } catch (err) {
          console.error("Unexpected error fetching profile:", err);
        }
      };
      
      fetchUserProfile();
      promptState.fetchSavedPrompts();
    }
  }, [user, promptState]);
  
  // Save draft when specifically requested, with explicit notification
  const handleSaveDraft = () => {
    promptState.saveDraft(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <XPanelButton />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto min-h-screen flex flex-col items-center justify-center gap-8">
            {/* Session info and draft status bar */}
            {user && promptState.currentStep === 2 && (
              <div className="fixed top-0 right-0 left-0 z-50 bg-background/90 backdrop-blur-sm border-b p-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {promptState.isDirty && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse flex gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Unsaved changes</span>
                    </Badge>
                  )}
                  
                  {promptState.isSaving && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Saving...</span>
                    </Badge>
                  )}
                  
                  {!promptState.isDirty && !promptState.isSaving && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1">
                      <span>All changes saved</span>
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {sessionTimer && (
                    <div className="text-xs flex items-center gap-1">
                      <span className={sessionTimer === "Expired" ? "text-red-500" : "text-muted-foreground"}>
                        Session: {sessionTimer}
                      </span>
                      <button 
                        onClick={refreshSession}
                        className="text-xs text-blue-500 hover:text-blue-700"
                        title="Refresh session"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  
                  {promptState.isDirty && (
                    <button
                      onClick={handleSaveDraft}
                      className="text-xs flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded"
                    >
                      <Save className="h-3 w-3" />
                      Save draft
                    </button>
                  )}
                </div>
              </div>
            )}
            
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
