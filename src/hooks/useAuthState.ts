
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useConnectionManager } from '@/hooks/useConnectionManager';

/**
 * A simplified hook that handles authentication state management
 */
export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const { toast } = useToast();
  
  // Use our unified connection manager
  const { 
    isOnline, 
    status: connectionStatus,
    checkConnection
  } = useConnectionManager();
  
  // Abort controller ref for cancellable operations
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get current auth session
  const getSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }
      
      return data.session;
    } catch (err) {
      console.error('Exception fetching session:', err);
      return null;
    }
  }, []);
  
  // Simplified login function with better error handling
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    if (!isOnline) {
      return { 
        error: { 
          message: "You're offline. Please check your internet connection before logging in." 
        } 
      };
    }
    
    setLoginInProgress(true);
    setAuthError(null);
    
    // Create a new abort controller for this login attempt
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 15000); // 15 second timeout
    
    try {
      // First ensure we have a connection
      const connectionOk = await checkConnection();
      if (!connectionOk) {
        clearTimeout(timeoutId);
        setLoginInProgress(false);
        return { 
          error: { 
            message: "Unable to connect to authentication service. Please check your connection." 
          } 
        };
      }
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        setAuthError(error.message);
        setLoginInProgress(false);
        return { error };
      }
      
      // Success case
      setAuthError(null);
      setLoginInProgress(false);
      return { error: null };
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Login exception:', err);
      
      // Check if this was an abort error (timeout)
      if (err.name === 'AbortError') {
        setAuthError('Login attempt timed out. Please try again.');
        toast({
          title: "Login Timeout",
          description: "The server took too long to respond. Please try again.",
          variant: "destructive",
        });
      } else {
        setAuthError(err.message || 'An unexpected error occurred during login');
      }
      
      setLoginInProgress(false);
      return { error: err };
    }
  }, [isOnline, checkConnection, toast]);
  
  // Simplified signup function
  const signup = useCallback(async (email: string, password: string, options?: { data?: any }) => {
    if (!isOnline) {
      return { 
        error: { 
          message: "You're offline. Please check your internet connection before signing up." 
        } 
      };
    }
    
    setLoginInProgress(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options
      });
      
      if (error) {
        setAuthError(error.message);
        setLoginInProgress(false);
        return { error };
      }
      
      // Success case
      setAuthError(null);
      setLoginInProgress(false);
      return { error: null };
    } catch (err) {
      console.error('Signup exception:', err);
      setAuthError(err.message || 'An unexpected error occurred during signup');
      setLoginInProgress(false);
      return { error: err };
    }
  }, [isOnline]);
  
  // Simplified logout function
  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during sign out:', error);
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      console.error('Exception during sign out:', err);
      return { error: err };
    }
  }, []);
  
  // Set up authentication state listener and initialize session
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mounted) return;
            
            console.log(`Auth state changed: ${event}`);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (event === 'SIGNED_IN') {
              toast({
                title: "Signed in successfully",
                description: "Welcome back!",
              });
            } else if (event === 'SIGNED_OUT') {
              toast({
                title: "Signed out",
                description: "You have been signed out successfully.",
              });
            }
          }
        );
        
        // Get initial session
        const initialSession = await getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }
        
        return () => {
          subscription.unsubscribe();
          mounted = false;
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initAuth();
    
    return () => {
      mounted = false;
    };
  }, [getSession, toast]);
  
  return {
    user,
    session,
    loading,
    authError,
    loginInProgress,
    connectionStatus,
    isOnline,
    login,
    signup,
    logout,
    setAuthError: setAuthError,
  };
};
