
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
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/x-panel" element={<XPanel />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/support" element={<Support />} />
            </Routes>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
