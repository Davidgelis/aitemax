
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getConnectionHealth, refreshSupabaseConnection } from '@/integrations/supabase/client';

export const useSessionControls = () => {
  const { sessionExpiresAt, refreshSession, isOnline, reconnect } = useAuth();
  const [timer, setTimer] = useState('');
  const [aboutToExpire, setAboutToExpire] = useState(false);
  const [refreshInProgress, setRefreshInProgress] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<any>(getConnectionHealth());
  const { toast } = useToast();
  
  // Reduced frequency connection health checks with better state management
  useEffect(() => {
    // Initial check on mount
    setConnectionHealth(getConnectionHealth());
    
    const healthCheckInterval = setInterval(() => {
      const health = getConnectionHealth();
      
      // Only update UI and show toast on actual status changes to avoid notification spam
      if (health.status !== connectionHealth?.status) {
        setConnectionHealth(health);
        
        // Only show restored toast when coming back from offline or degraded
        if (health.status === 'healthy' && 
            (connectionHealth?.status === 'offline' || connectionHealth?.status === 'degraded')) {
          toast({
            title: "Connection Restored",
            description: "Your connection to our services has been restored.",
          });
        } else if (health.status === 'offline' && 
                  (connectionHealth?.status === 'healthy' || connectionHealth?.status === 'degraded')) {
          toast({
            title: "Connection Lost",
            description: "You appear to be offline. Some features may be unavailable.",
            variant: "destructive",
          });
        } else if (health.status === 'degraded' && connectionHealth?.status === 'healthy') {
          // Only notify of degraded status from healthy, not from offline
          toast({
            title: "Connection Issues",
            description: "Your connection appears unstable. Some operations may be slower.",
            variant: "warning",
          });
        }
      } else {
        // Silent update for unchanged status
        setConnectionHealth(health);
      }
    }, 45000); // Reduced frequency to 45 seconds to lower overhead
    
    return () => clearInterval(healthCheckInterval);
  }, [connectionHealth, toast]);

  // Timer calculation with improved expiration handling
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
    
    // Proactive refresh with better connection health awareness
    // Only attempt refresh when connection is healthy and less than 4 minutes remain
    if (left < 4 * 60 * 1000 && isOnline && !refreshInProgress && connectionHealth?.status === 'healthy') {
      setRefreshInProgress(true);
      refreshSession().finally(() => {
        setTimeout(() => setRefreshInProgress(false), 5000);
      });
    }
  }, [sessionExpiresAt, refreshSession, isOnline, refreshInProgress, connectionHealth]);

  // Manual refresh with enhanced recovery capabilities
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
      
      // First check if we can restore basic connectivity
      if (connectionHealth?.status !== 'healthy') {
        toast({
          title: "Checking Connection",
          description: "Attempting to restore connection before refreshing...",
        });
        
        const reconnected = await refreshSupabaseConnection();
        
        if (!reconnected) {
          toast({
            title: "Connection Failed",
            description: "Unable to establish connection. Please check your network.",
            variant: "destructive",
          });
          return;
        }
        
        // Update connection health after successful reconnection
        setConnectionHealth(getConnectionHealth());
      }
      
      // Now attempt to refresh the session
      await refreshSession();
      
      toast({
        title: "Session Refreshed",
        description: "Your session has been successfully refreshed.",
      });
    } catch (error) {
      console.error("Session refresh failed:", error);
      
      // Attempt to reconnect with full recovery sequence
      try {
        toast({
          title: "Connection Issues",
          description: "Attempting to restore connection...",
          variant: "warning",
        });
        
        // First try basic connectivity restoration
        const basicReconnect = await refreshSupabaseConnection();
        
        if (basicReconnect) {
          // Then try auth-specific reconnection
          const authReconnect = await reconnect();
          
          if (authReconnect) {
            toast({
              title: "Connection Recovered",
              description: "Your connection was restored and session refreshed.",
            });
          } else {
            toast({
              title: "Partial Connection",
              description: "Basic connection restored but authentication issues remain.",
              variant: "warning",
            });
          }
        } else {
          toast({
            title: "Refresh Failed",
            description: "Unable to refresh your session. Please check your connection.",
            variant: "destructive",
          });
        }
      } catch (reconnectError) {
        console.error("Reconnection attempt failed:", reconnectError);
        toast({
          title: "Refresh Failed",
          description: "Unable to refresh your session. Please try again or sign in again.",
          variant: "destructive",
        });
      }
    } finally {
      // Ensure refresh state is always cleared with adequate delay
      setTimeout(() => setRefreshInProgress(false), 2000);
    }
  }, [refreshSession, isOnline, refreshInProgress, toast, reconnect, connectionHealth]);

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
