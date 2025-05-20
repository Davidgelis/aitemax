
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getConnectionHealth } from '@/integrations/supabase/client';

export const useSessionControls = () => {
  const { sessionExpiresAt, refreshSession, isOnline, reconnect } = useAuth();
  const [timer, setTimer] = useState('');
  const [aboutToExpire, setAboutToExpire] = useState(false);
  const [refreshInProgress, setRefreshInProgress] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<any>(getConnectionHealth());
  const { toast } = useToast();

  // Less frequent connection health checks
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      const health = getConnectionHealth();
      setConnectionHealth(health);
      
      // Only show connection restored toast when coming back from offline
      if (health.status === 'healthy' && connectionHealth?.status === 'offline') {
        toast({
          title: "Connection Restored",
          description: "Your connection to our services has been restored.",
        });
      }
    }, 15000); // Check every 15 seconds (reduced frequency)
    
    return () => clearInterval(healthCheckInterval);
  }, [connectionHealth, toast]);

  // Timer calculation
  const calc = useCallback(() => {
    if (!sessionExpiresAt) {
      setTimer('No session');
      return;
    }
    
    const now = Date.now();
    const left = sessionExpiresAt.getTime() - now;
    
    if (left <= 0) {
      setTimer('Expired');
      return;
    }
    
    // Show warning when less than 5 minutes remain
    setAboutToExpire(left < 5 * 60 * 1000);
    
    // Format the remaining time
    const m = Math.floor(left / 60000).toString().padStart(2, '0');
    const s = Math.floor((left % 60000) / 1000).toString().padStart(2, '0');
    setTimer(`${m}:${s}`);
    
    // Proactive refresh - refresh when less than 4 minutes remain
    if (left < 4 * 60 * 1000 && isOnline && !refreshInProgress) {
      setRefreshInProgress(true);
      refreshSession().finally(() => {
        setTimeout(() => setRefreshInProgress(false), 5000);
      });
    }
  }, [sessionExpiresAt, refreshSession, isOnline, refreshInProgress]);

  // Manual refresh with simplified error handling
  const handleManualRefresh = useCallback(async () => {
    if (refreshInProgress) return;
    
    try {
      setRefreshInProgress(true);
      
      if (!isOnline) {
        toast({
          title: "You're offline",
          description: "Please check your internet connection before refreshing your session.",
          variant: "destructive",
        });
        return;
      }
      
      await refreshSession();
      
      toast({
        title: "Session Refreshed",
        description: "Your session has been successfully refreshed.",
      });
    } catch (error) {
      console.error("Session refresh failed:", error);
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh your session. Please try again or sign in again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setRefreshInProgress(false), 2000);
    }
  }, [refreshSession, isOnline, refreshInProgress, toast]);

  // Calculate session timer regularly
  useEffect(() => {
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [calc]);

  return { 
    timer, 
    aboutToExpire, 
    refreshSession: handleManualRefresh, 
    isOnline, 
    reconnect,
    refreshInProgress,
    connectionHealth
  };
};
