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
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, options?: { data?: { username?: string, preferred_language?: string } }) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
  refreshSession: () => Promise<void>;
  sessionExpiresAt: Date | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Increase session refresh interval to 30 minutes (matching longer-lived sessions)
const SESSION_REFRESH_INTERVAL = 30 * 60 * 1000; 

// Increase inactivity threshold to 4 hours before requiring a session refresh
const INACTIVITY_REFRESH_TIMEOUT = 4 * 60 * 60 * 1000;

// Warning time before session expires (in milliseconds) - 30 minutes
const SESSION_WARNING_TIME = 30 * 60 * 1000;

// Maximum retry attempts for session refresh
const MAX_REFRESH_RETRIES = 3;

// Debounce time for refresh attempts
const REFRESH_DEBOUNCE = 2000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [refreshRetryCount, setRefreshRetryCount] = useState(0);
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const { toast } = useToast();
  
  // Function to refresh the session with debounce to prevent multiple simultaneous refreshes
  const refreshSession = useCallback(async () => {
    try {
      // Implement debounce - prevent multiple refresh attempts within 2 seconds
      const now = Date.now();
      if (now - lastRefreshTime < REFRESH_DEBOUNCE) {
        console.log("Skipping refresh - too soon since last attempt");
        return;
      }
      
      setLastRefreshTime(now);
      console.log("Refreshing authentication session...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error.message);
        
        // Implement retry logic
        if (refreshRetryCount < MAX_REFRESH_RETRIES) {
          console.log(`Retrying session refresh (${refreshRetryCount + 1}/${MAX_REFRESH_RETRIES})...`);
          setRefreshRetryCount(prev => prev + 1);
          // Try again after a delay with exponential backoff
          setTimeout(refreshSession, 1000 * Math.pow(2, refreshRetryCount));
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
  }, [refreshRetryCount, toast, lastRefreshTime]);

  // Handle refresh page action
  const handleRefreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  // Set up automatic session refresh with longer intervals
  useEffect(() => {
    if (!session) return;
    
    let lastActivity = Date.now();
    
    // Update last activity time when user interacts with the page
    const updateLastActivity = () => {
      lastActivity = Date.now();
    };
    
    // Set up interval to refresh session periodically
    const refreshInterval = setInterval(() => {
      console.log("Automatic session refresh triggered");
      refreshSession();
    }, SESSION_REFRESH_INTERVAL);
    
    // Check for inactivity every 15 minutes (reduced frequency)
    const inactivityInterval = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      
      // If user has been inactive but now becomes active again after threshold, refresh session
      if (inactiveTime >= INACTIVITY_REFRESH_TIMEOUT) {
        console.log(`User was inactive for ${inactiveTime/1000/60} minutes, refreshing session`);
        refreshSession();
        lastActivity = now; // Reset last activity
      }
    }, 15 * 60 * 1000); // Check every 15 minutes
    
    // Add event listeners for tab visibility and user activity
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;
        
        // Only refresh if it's been more than 5 minutes since the last activity
        if (timeSinceLastActivity > 5 * 60 * 1000) {
          console.log("User returned to the app after inactivity, refreshing session");
          refreshSession();
        }
        
        updateLastActivity();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add additional activity monitors to keep session fresh
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    activityEvents.forEach(event => {
      window.addEventListener(event, updateLastActivity, { passive: true });
    });
    
    return () => {
      clearInterval(refreshInterval);
      clearInterval(inactivityInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateLastActivity);
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

  // Set up session expiration warning with larger buffer time
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
        duration: 60000, // Show for 1 minute instead of indefinitely
      });
    }, timeUntilWarning);
    
    return () => clearTimeout(warningTimeout);
  }, [sessionExpiresAt, refreshSession, toast]);

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      // For Supabase v2, we can't directly specify a longer session during login
      // We need to login first, then adjust settings if rememberMe is true
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      // If rememberMe is true and login was successful, we can set a longer session
      if (!error && rememberMe) {
        console.log("Remember me selected, extending session duration");
        
        // Get the current session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData && sessionData.session) {
          // Refresh the session to extend its duration
          // This will get a new session with longer expiration
          const { error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: sessionData.session.refresh_token,
          });
          
          if (refreshError) {
            console.error("Error extending session:", refreshError);
          }
        }
      }
      
      return { error };
    } catch (err) {
      console.error("Error during sign in:", err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, options?: { data?: { username?: string, preferred_language?: string } }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: options?.data
        }
      });
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
