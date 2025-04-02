
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw } from 'lucide-react';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
  refreshSession: () => Promise<void>;
  sessionExpiresAt: Date | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constant for session refresh interval - refresh every 30 minutes
const SESSION_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Warning time before session expires (in milliseconds)
const SESSION_WARNING_TIME = 10 * 60 * 1000; // 10 minutes before expiration

// Maximum retry attempts for session refresh
const MAX_REFRESH_RETRIES = 3;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [refreshRetryCount, setRefreshRetryCount] = useState(0);
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false);
  const { toast } = useToast();
  
  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      console.log("Refreshing authentication session...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error.message);
        
        // Implement retry logic
        if (refreshRetryCount < MAX_REFRESH_RETRIES) {
          console.log(`Retrying session refresh (${refreshRetryCount + 1}/${MAX_REFRESH_RETRIES})...`);
          setRefreshRetryCount(prev => prev + 1);
          // Try again after a delay
          setTimeout(refreshSession, 5000);
        } else {
          console.error("Max refresh retries reached. Session may expire soon.");
          toast({
            title: "Session refresh failed",
            description: "You may need to login again soon",
            variant: "destructive",
          });
          setRefreshRetryCount(0);
          // Show session expired dialog when max retries are reached
          setShowSessionExpiredDialog(true);
        }
        return;
      }
      
      // Reset retry count on success
      setRefreshRetryCount(0);
      
      if (data.session) {
        console.log("Session refreshed successfully");
        setSession(data.session);
        setUser(data.session.user);
        
        // Calculate and set session expiration time
        if (data.session.expires_at) {
          const expiryTime = new Date(data.session.expires_at * 1000);
          setSessionExpiresAt(expiryTime);
          console.log(`Session will expire at: ${expiryTime.toLocaleString()}`);
        }
      } else {
        console.log("No session data returned from refresh");
        // Show session expired dialog when no session data is returned
        setShowSessionExpiredDialog(true);
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error);
      // Show session expired dialog on unexpected errors
      setShowSessionExpiredDialog(true);
    }
  }, [refreshRetryCount, toast]);

  // Handle refresh page action
  const handleRefreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  // Set up automatic session refresh
  useEffect(() => {
    if (!session) return;
    
    // Set up interval to refresh session periodically
    const refreshInterval = setInterval(() => {
      console.log("Automatic session refresh triggered");
      refreshSession();
    }, SESSION_REFRESH_INTERVAL);
    
    // Also refresh when user becomes active again after being away
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("User returned to the app, refreshing session");
        refreshSession();
      }
    };

    // Add event listeners for tab visibility and user activity
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add additional activity monitors to keep session fresh
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    let activityTimeout: number | null = null;
    
    const handleUserActivity = () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      // Only refresh if it's been at least 1 minute since the last refresh
      activityTimeout = window.setTimeout(() => {
        console.log("User activity detected, refreshing session");
        refreshSession();
      }, 60000); // Wait 1 minute of inactivity before refreshing
    };
    
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });
    
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [session, refreshSession]);

  // Get initial session
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        // Calculate and set session expiration time
        if (session?.expires_at) {
          const expiryTime = new Date(session.expires_at * 1000);
          setSessionExpiresAt(expiryTime);
          console.log(`Initial session will expire at: ${expiryTime.toLocaleString()}`);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error getting initial session:", error);
        setLoading(false);
      }
    };
    
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth state changed: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Calculate and set session expiration time
        if (session?.expires_at) {
          const expiryTime = new Date(session.expires_at * 1000);
          setSessionExpiresAt(expiryTime);
          console.log(`Updated session will expire at: ${expiryTime.toLocaleString()}`);
        } else {
          setSessionExpiresAt(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Set up session expiration warning
  useEffect(() => {
    if (!sessionExpiresAt) return;
    
    // Calculate time until warning should appear
    // Show warning when session is X minutes from expiring
    const now = new Date();
    const warningTime = new Date(sessionExpiresAt.getTime() - SESSION_WARNING_TIME);
    const timeUntilWarning = Math.max(0, warningTime.getTime() - now.getTime());
    
    console.log(`Will show session warning in: ${Math.floor(timeUntilWarning/60000)} minutes`);
    
    // Set timeout for warning
    const warningTimeout = setTimeout(() => {
      toast({
        title: "Session expiring soon",
        description: "Your session will expire soon. Would you like to stay logged in?",
        action: (
          <button 
            onClick={refreshSession}
            className="rounded bg-accent px-2 py-1 text-xs text-white"
          >
            Stay logged in
          </button>
        ),
        duration: 0, // Don't auto-dismiss this toast
      });
    }, timeUntilWarning);
    
    return () => clearTimeout(warningTimeout);
  }, [sessionExpiresAt, refreshSession, toast]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      console.error("Error during sign in:", err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error };
    } catch (err) {
      console.error("Error during sign up:", err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      console.error("Error during sign out:", err);
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      signIn, 
      signUp, 
      signOut, 
      loading,
      refreshSession,
      sessionExpiresAt
    }}>
      <AlertDialog open={showSessionExpiredDialog} onOpenChange={setShowSessionExpiredDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session Expired</AlertDialogTitle>
            <AlertDialogDescription>
              Your session has expired. To continue using the app without experiencing bugs, 
              please refresh the page to restore your session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleRefreshPage} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
