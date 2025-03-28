import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// 30 minutes in milliseconds
const SESSION_TIMEOUT = 30 * 60 * 1000;

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
  // Add a function to refresh the timeout
  refreshSessionTimeout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use ref to keep track of the timeout
  const sessionTimeoutRef = useRef<number | null>(null);

  // Clear the timeout to prevent memory leaks
  const clearSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      window.clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, []);

  // Function to refresh the session timeout
  const refreshSessionTimeout = useCallback(() => {
    // Clear any existing timeout
    clearSessionTimeout();
    
    // Only set a timeout if we have a user
    if (user) {
      // Set a new timeout for session expiry
      sessionTimeoutRef.current = window.setTimeout(async () => {
        console.log('Session timed out after inactivity');
        // Sign the user out
        await supabase.auth.signOut();
      }, SESSION_TIMEOUT);
    }
  }, [user, clearSessionTimeout]);

  // Setup session timeout for inactivity
  useEffect(() => {
    // Initially set the timeout if we have a user
    if (user) {
      refreshSessionTimeout();
    }

    // Reset the timeout on user interaction
    const resetTimeout = () => {
      if (user) {
        refreshSessionTimeout();
      }
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keydown', resetTimeout);
    window.addEventListener('click', resetTimeout);
    window.addEventListener('scroll', resetTimeout);
    window.addEventListener('touchstart', resetTimeout);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      window.removeEventListener('click', resetTimeout);
      window.removeEventListener('scroll', resetTimeout);
      window.removeEventListener('touchstart', resetTimeout);
      
      // Clear the timeout
      clearSessionTimeout();
    };
  }, [user, refreshSessionTimeout, clearSessionTimeout]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Set timeout if we have a user
      if (session?.user) {
        refreshSessionTimeout();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // If session is null, clear the timeout
        if (!session) {
          clearSessionTimeout();
        } else {
          // If we got a new session, refresh the timeout
          refreshSessionTimeout();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearSessionTimeout();
    };
  }, [refreshSessionTimeout, clearSessionTimeout]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    clearSessionTimeout();
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      signIn, 
      signUp, 
      signOut, 
      loading,
      refreshSessionTimeout
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
