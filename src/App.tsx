
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useBeforeUnload } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ModelProvider } from "@/context/ModelContext";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import XPanel from "./pages/XPanel";
import PromptView from "./pages/PromptView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle the beforeunload event
const BeforeUnloadHandler = () => {
  const [hasDirtyState, setHasDirtyState] = useState(false);
  
  // Listen for a custom event that can be dispatched from any component
  useEffect(() => {
    const handleDirtyState = (e: CustomEvent) => {
      setHasDirtyState(e.detail.isDirty);
    };
    
    window.addEventListener('dirtyStateChange' as any, handleDirtyState);
    
    return () => {
      window.removeEventListener('dirtyStateChange' as any, handleDirtyState);
    };
  }, []);
  
  // Show a confirmation dialog if there's dirty state
  useBeforeUnload(
    (event) => {
      if (hasDirtyState) {
        event.preventDefault();
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    }
  );
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ModelProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <BeforeUnloadHandler />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/x-panel" element={<XPanel />} />
              <Route path="/prompt/:id" element={<PromptView />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ModelProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
