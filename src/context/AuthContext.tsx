
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Error refreshing session:", error.message);
        return;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        
        // Calculate and set session expiration time
        if (data.session.expires_at) {
          const expiryTime = new Date(data.session.expires_at * 1000);
          setSessionExpiresAt(expiryTime);
        }
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Calculate and set session expiration time
      if (session?.expires_at) {
        const expiryTime = new Date(session.expires_at * 1000);
        setSessionExpiresAt(expiryTime);
      }
      
      setLoading(false);
    }).catch(error => {
      console.error("Error getting session:", error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Calculate and set session expiration time
        if (session?.expires_at) {
          const expiryTime = new Date(session.expires_at * 1000);
          setSessionExpiresAt(expiryTime);
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
    
    // Calculate time until 5 minutes before session expires
    const warningTime = new Date(sessionExpiresAt.getTime() - 5 * 60 * 1000);
    const now = new Date();
    const timeUntilWarning = Math.max(0, warningTime.getTime() - now.getTime());
    
    // Set timeout for warning
    const warningTimeout = setTimeout(() => {
      toast({
        title: "Session expiring soon",
        description: "Your session will expire in 5 minutes. Would you like to stay logged in?",
        action: (
          <button 
            onClick={refreshSession}
            className="rounded bg-accent px-2 py-1 text-xs text-white"
          >
            Stay logged in
          </button>
        ),
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
