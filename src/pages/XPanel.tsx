import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/dashboard/UserSidebar";
import { usePromptState } from "@/hooks/usePromptState";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, RefreshCw, Clock, Save } from "lucide-react";
import { getAvatarByValue } from "@/config/avatarConfig";

const XPanel = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session, loading: authLoading, sessionExpiresAt, refreshSession } = useAuth();
  const [sessionTimer, setSessionTimer] = useState<string>("");
  
  // Create promptState after getting auth state
  const promptState = usePromptState(user);
  
  const filteredPrompts = promptState.savedPrompts.filter(
    (prompt) => prompt.title.toLowerCase().includes(promptState.searchTerm.toLowerCase())
  );
  
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
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth state change in XPanel: ${event}`);
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto min-h-screen flex flex-col gap-8">
            {/* Session info and draft status bar */}
            {user && (
              <div className="fixed top-0 right-0 left-0 z-50 bg-background/90 backdrop-blur-sm border-b p-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 text-muted-foreground"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </div>
                
                <div className="flex items-center gap-3">
                  {sessionTimer && (
                    <div className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className={isSessionAboutToExpire() ? "text-red-500" : "text-muted-foreground"}>
                        Session: {sessionTimer}
                      </span>
                      <button 
                        onClick={refreshSession}
                        className="text-xs text-blue-500 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Refresh session"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-16">
              <h1 className="text-3xl font-bold mb-6">X Panel</h1>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Prompt Statistics</CardTitle>
                        <CardDescription>Overview of your prompt activity</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Prompts</span>
                            <Badge variant="outline">{promptState.savedPrompts.length}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Drafts</span>
                            <Badge variant="outline">{promptState.drafts.length}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>Your account details</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-[#33fea6]">
                              {userProfile?.avatar_url ? (
                                <img 
                                  src={getAvatarByValue(userProfile.avatar_url).src}
                                  alt="User Avatar"
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <span className="text-xl font-bold text-muted-foreground">
                                    {user?.email?.charAt(0).toUpperCase() || "U"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{userProfile?.username || (user?.email || "User")}</p>
                              <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate("/profile")}
                            >
                              Edit Profile
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="analytics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analytics</CardTitle>
                      <CardDescription>Detailed analytics about your prompts and usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Analytics features coming soon.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Settings</CardTitle>
                      <CardDescription>Manage your X Panel settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Settings features coming soon.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
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
          fetchSavedPrompts={promptState.fetchSavedPrompts}
        />
      </div>
    </SidebarProvider>
  );
};

export default XPanel;
