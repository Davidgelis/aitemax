
import React, { createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';

// Define the auth context type
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, options?: { data?: any }) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
  isOnline: boolean;
  sessionExpiresAt: Date | null;
  authError: string | null;
  setAuthError: (error: string | null) => void;
};

// Create context with undefined initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps the app
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    user,
    session,
    loading,
    authError,
    login,
    signup,
    logout,
    isOnline,
    setAuthError
  } = useAuthState();

  // Calculate session expiration time
  const sessionExpiresAt = session?.expires_at 
    ? new Date(session.expires_at * 1000) 
    : null;

  // Simplified session refresh
  const refreshSession = async (): Promise<void> => {
    try {
      console.log('Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }
      
      if (data.session) {
        console.log('Session refreshed successfully');
      }
    } catch (error) {
      console.error('Exception refreshing session:', error);
      throw error;
    }
  };

  // Context value
  const value: AuthContextType = {
    session,
    user,
    loading,
    authError,
    signIn: login, 
    signUp: signup,
    signOut: logout,
    refreshSession,
    isOnline,
    sessionExpiresAt,
    setAuthError,
  };

  // Render provider with value
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
