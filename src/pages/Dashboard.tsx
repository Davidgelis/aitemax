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
import { AlertCircle, Save, RefreshCw, Clock } from "lucide-react";
import { useLanguage } from '@/context/LanguageContext';
import { dashboardTranslations } from '@/translations/dashboard';

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
  
  // Set up session timer display with more frequent updates
  useEffect(() => {
    if (!sessionExpiresAt) return;
    
    const updateTimer = () => {
      const now = new Date();
      const timeLeft = sessionExpiresAt.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setSessionTimer("Expired");
        // If session has expired, try to refresh it immediately
        refreshSession();
        return;
      }
      
      // Format time left as MM:SS
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      setSessionTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      
      // Pre-emptive refresh when getting close to expiration
      if (timeLeft < 120000) { // Less than 2 minutes remaining
        console.log("Session expiring soon, refreshing proactively");
        refreshSession();
      }
    };
    
    // Update timer immediately
    updateTimer();
    
    // Set up interval to update timer every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [sessionExpiresAt, refreshSession]);
  
  // Add a utility function to check if session is about to expire
  const isSessionAboutToExpire = () => {
    if (!sessionExpiresAt) return false;
    
    const now = new Date();
    const timeLeft = sessionExpiresAt.getTime() - now.getTime();
    
    // Consider "about to expire" if less than 5 minutes remain
    return timeLeft < 5 * 60 * 1000;
  };
  
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
        console.log(`Auth state change in Dashboard: ${event}`);
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
  
  // Add periodic session refresh for active users with better error handling
  useEffect(() => {
    // Only refresh if there's an active session and user is interacting with the app
    if (!session) return;
    
    // Auto-refresh when fetching prompts fails due to auth issues
    if (promptState.fetchPromptError) {
      const errorMessage = promptState.fetchPromptError.message || '';
      if (errorMessage.includes('JWT') || 
          errorMessage.includes('token') ||
          errorMessage.includes('auth')) {
        console.log("Auth error detected in prompt fetch, refreshing session");
        refreshSession().then(() => {
          // Wait a bit after refresh before retrying fetch
          setTimeout(() => {
            promptState.fetchSavedPrompts();
          }, 1000);
        });
      }
    }

    // Add additional hotfix for prompt loading issues
    const checkPromptsInterval = setInterval(() => {
      if (promptState.fetchPromptError && !promptState.isLoadingPrompts) {
        console.log("Periodic retry for failed prompt fetch");
        promptState.fetchSavedPrompts();
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(checkPromptsInterval);
    };
  }, [session, refreshSession, promptState]);

  // Check for redirected prompt from index page
  useEffect(() => {
    const redirectedPrompt = sessionStorage.getItem("redirectedPrompt");
    const stayOnStepOne = sessionStorage.getItem("stayOnStepOne") === "true";
    
    if (redirectedPrompt) {
      // Set the prompt text from the redirect
      promptState.setPromptText(redirectedPrompt);
      
      // Only move to step 2 if stayOnStepOne is false
      if (!stayOnStepOne && promptState.currentStep === 1) {
        promptState.setCurrentStep(2);
      }
      
      // Clear the stored prompt and flag to avoid reusing them on refresh
      sessionStorage.removeItem("redirectedPrompt");
      sessionStorage.removeItem("stayOnStepOne");
    }
  }, [promptState]);

  const { currentLanguage } = useLanguage();
  
  const t = dashboardTranslations[currentLanguage as keyof typeof dashboardTranslations] || dashboardTranslations.en;

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <XPanelButton />
        <main className="flex-1 p-4 flex flex-col overflow-hidden">
          <div className="max-w-6xl mx-auto h-full flex flex-col w-full">
            {/* Session info and draft status bar */}
            {user && promptState.currentStep === 2 && (
              <div className="fixed top-0 right-0 left-0 z-50 bg-background/90 backdrop-blur-sm border-b p-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {promptState.isDirty && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse flex gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{t.userActions.unsavedChanges}</span>
                    </Badge>
                  )}
                  
                  {promptState.isSaving && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>{t.userActions.saving}</span>
                    </Badge>
                  )}
                  
                  {!promptState.isDirty && !promptState.isSaving && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1">
                      <span>{t.userActions.allChangesSaved}</span>
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {sessionTimer && (
                    <div className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className={isSessionAboutToExpire() ? "text-red-500" : "text-muted-foreground"}>
                        {t.userActions.session}: {sessionTimer}
                      </span>
                      <button 
                        onClick={refreshSession}
                        className="text-xs text-blue-500 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50"
                        title={t.userActions.refreshSession}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  
                  {promptState.isDirty && (
                    <button
                      onClick={handleSaveDraft}
                      className="text-xs flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded transition-colors"
                    >
                      <Save className="h-3 w-3" />
                      {t.userActions.saveDraft}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex-grow flex items-center justify-center overflow-hidden">
              <StepController 
                user={user} 
                selectedModel={selectedModel} 
                setSelectedModel={setSelectedModel}
                promptState={promptState}
                sessionTimer={sessionTimer}
                refreshSession={refreshSession}
                isSessionAboutToExpire={isSessionAboutToExpire}
              />
            </div>
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
