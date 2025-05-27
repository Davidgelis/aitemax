
import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  
  // Simple online status tracking
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
  
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      console.log('Login attempt for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) {
        console.error('Login error:', error);
        return { error };
      }
      
      console.log('Login successful for:', email);
      return { error: null };
    } catch (err: any) {
      console.error('Login exception:', err);
      return { error: { message: err.message || 'Login failed' } };
    }
  }, []);
  
  const signup = useCallback(async (email: string, password: string, options?: { data?: any }) => {
    try {
      console.log('Signup attempt for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options
      });
      
      if (error) {
        console.error('Signup error:', error);
        return { error };
      }
      
      console.log('Signup successful for:', email);
      return { error: null };
    } catch (err: any) {
      console.error('Signup exception:', err);
      return { error: { message: err.message || 'Signup failed' } };
    }
  }, []);
  
  const logout = useCallback(async () => {
    try {
      console.log('Logout attempt');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        return { error };
      }
      
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
          (event, session) => {
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
            }
          }
        );
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          console.log('Initial session:', session?.user?.email || 'no session');
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
    isOnline,
    login,
    signup,
    logout
  };
};
