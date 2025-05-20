
import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Index from './pages/Index';
import XPanel from './pages/XPanel';
import ResetPassword from './pages/ResetPassword';
import Support from './pages/Support';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/context/LanguageContext';
import PasswordProtectedRoute from './components/PasswordProtectedRoute';

// Create QueryClient with enhanced error handling for auth-related queries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry for auth-related errors or for server errors
        if (error?.status === 401 || error?.status === 403 || error?.status >= 500) {
          return false;
        }
        // Retry network-related failures more aggressively, up to 3 times
        if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
          return failureCount < 3;
        }
        // Default retry behavior for other errors (up to 2 times)
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <Routes>
              {/* Auth page is excluded from password protection */}
              <Route path="/auth" element={<Auth />} />
              
              {/* All other routes are behind password protection */}
              <Route path="/" element={
                <PasswordProtectedRoute>
                  <Index />
                </PasswordProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <PasswordProtectedRoute>
                  <Dashboard />
                </PasswordProtectedRoute>
              } />
              <Route path="/x-panel" element={
                <PasswordProtectedRoute>
                  <XPanel />
                </PasswordProtectedRoute>
              } />
              <Route path="/profile" element={
                <PasswordProtectedRoute>
                  <Profile />
                </PasswordProtectedRoute>
              } />
              <Route path="/reset-password" element={
                <PasswordProtectedRoute>
                  <ResetPassword />
                </PasswordProtectedRoute>
              } />
              <Route path="/support" element={
                <PasswordProtectedRoute>
                  <Support />
                </PasswordProtectedRoute>
              } />
            </Routes>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
