
import React, { createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuthState } from '@/hooks/useAuthState';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, options?: { data?: any }) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  isOnline: boolean;
  refreshSession: () => Promise<void>;
  sessionExpiresAt: Date | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    user,
    session,
    loading,
    login,
    signup,
    logout,
    isOnline,
    refreshSession,
    sessionExpiresAt
  } = useAuthState();

  const value: AuthContextType = {
    session,
    user,
    loading,
    signIn: login, 
    signUp: signup,
    signOut: logout,
    isOnline,
    refreshSession,
    sessionExpiresAt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
