
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Simplified authentication state management with non-blocking connection checks
 */
export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const { toast } = useToast();
  
  // Simple online status tracking
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Basic online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Simplified login function without blocking connection checks
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    setLoginInProgress(true);
    setAuthError(null);
    
    try {
      console.log('Attempting login for:', email);
      
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
  }, []);
  
  // Simplified signup function
  const signup = useCallback(async (email: string, password: string, options?: { data?: any }) => {
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
  }, []);
  
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
    setAuthError
  };
};
