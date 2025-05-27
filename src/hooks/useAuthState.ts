
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Simplified and consolidated authentication state management
 */
export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const { toast } = useToast();
  
  // Track online status with more reliable detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Abort controller ref for cancellable operations
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Enhanced online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connection restored');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connection lost');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Enhanced connection check
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('https://xyfwsmblaayznplurmfa.supabase.co/rest/v1/', {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZndzbWJsYWF5em5wbHVybWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjQ5MzAsImV4cCI6MjA1NjQ0MDkzMH0.iSMjuUMOEGVP-eU7p1xng_XlSc3pNg_DbViVwyD3Fc8',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      const connectionOk = response.ok || response.status === 401; // 401 is expected for HEAD requests
      setIsOnline(connectionOk);
      return connectionOk;
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsOnline(false);
      return false;
    }
  }, []);
  
  // Simplified and robust login function
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    if (!isOnline) {
      const error = { message: "You're offline. Please check your internet connection." };
      setAuthError(error.message);
      return { error };
    }
    
    setLoginInProgress(true);
    setAuthError(null);
    
    // Cancel any previous login attempt
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    try {
      console.log('Attempting login for:', email);
      
      // First ensure we have a working connection
      const connectionOk = await checkConnection();
      if (!connectionOk) {
        const error = { message: "Unable to connect to authentication service. Please try again." };
        setAuthError(error.message);
        setLoginInProgress(false);
        return { error };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) {
        console.error('Login error:', error);
        setAuthError(error.message);
        setLoginInProgress(false);
        return { error };
      }
      
      if (data.session) {
        console.log('Login successful');
        setSession(data.session);
        setUser(data.user);
        setAuthError(null);
      }
      
      setLoginInProgress(false);
      return { error: null };
    } catch (err: any) {
      console.error('Login exception:', err);
      const errorMessage = err.message || 'An unexpected error occurred during login';
      setAuthError(errorMessage);
      setLoginInProgress(false);
      return { error: { message: errorMessage } };
    }
  }, [isOnline, checkConnection]);
  
  // Simplified signup function
  const signup = useCallback(async (email: string, password: string, options?: { data?: any }) => {
    if (!isOnline) {
      const error = { message: "You're offline. Please check your internet connection." };
      setAuthError(error.message);
      return { error };
    }
    
    setLoginInProgress(true);
    setAuthError(null);
    
    try {
      console.log('Attempting signup for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options
      });
      
      if (error) {
        console.error('Signup error:', error);
        setAuthError(error.message);
        setLoginInProgress(false);
        return { error };
      }
      
      console.log('Signup successful:', data);
      setAuthError(null);
      setLoginInProgress(false);
      return { error: null };
    } catch (err: any) {
      console.error('Signup exception:', err);
      const errorMessage = err.message || 'An unexpected error occurred during signup';
      setAuthError(errorMessage);
      setLoginInProgress(false);
      return { error: { message: errorMessage } };
    }
  }, [isOnline]);
  
  // Simplified logout function
  const logout = useCallback(async () => {
    try {
      console.log('Attempting logout');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        return { error };
      }
      
      // Clear state immediately
      setSession(null);
      setUser(null);
      setAuthError(null);
      
      console.log('Logout successful');
      return { error: null };
    } catch (err: any) {
      console.error('Logout exception:', err);
      return { error: err };
    }
  }, []);
  
  // Initialize authentication state
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log(`Auth state changed: ${event}`, session?.user?.email || 'no user');
            
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            
            // Show appropriate toasts
            if (event === 'SIGNED_IN' && session?.user) {
              toast({
                title: "Welcome back!",
                description: `Signed in as ${session.user.email}`,
              });
            } else if (event === 'SIGNED_OUT') {
              toast({
                title: "Signed out",
                description: "You have been signed out successfully.",
              });
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('Token refreshed successfully');
            }
          }
        );
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          if (session) {
            console.log('Found existing session for:', session.user.email);
          } else {
            console.log('No existing session found');
          }
        }
        
        return () => {
          subscription.unsubscribe();
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
  }, [toast]);
  
  return {
    user,
    session,
    loading,
    authError,
    loginInProgress,
    isOnline,
    login,
    signup,
    logout,
    setAuthError,
    checkConnection
  };
};
