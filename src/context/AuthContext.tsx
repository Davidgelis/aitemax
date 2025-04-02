
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

// Constant for session refresh interval - refresh every 5 minutes
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Warning time before session expires (in milliseconds)
const SESSION_WARNING_TIME = 10 * 60 * 1000; // 10 minutes before expiration

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      console.log("Refreshing authentication session...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error.message);
        return;
      }
      
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
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error);
    }
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
    
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, refreshSession]);

  useEffect(() => {
    // Get initial session
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
