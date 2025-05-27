
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useSessionControls = () => {
  const { sessionExpiresAt, refreshSession, isOnline } = useAuth();
  const [timer, setTimer] = useState('');
  const [aboutToExpire, setAboutToExpire] = useState(false);
  const [refreshInProgress, setRefreshInProgress] = useState(false);
  const { toast } = useToast();
  
  // Enhanced timer calculation with automatic refresh
  const calc = useCallback(() => {
    if (!sessionExpiresAt) {
      setTimer('No session');
      setAboutToExpire(false);
      return;
    }
    
    const now = Date.now();
    const left = sessionExpiresAt.getTime() - now;
    
    if (left <= 0) {
      setTimer('Expired');
      setAboutToExpire(true);
      return;
    }
    
    // Show warning when less than 5 minutes remain
    const isAboutToExpire = left < 5 * 60 * 1000;
    setAboutToExpire(isAboutToExpire);
    
    // Format the remaining time
    const hours = Math.floor(left / (60 * 60 * 1000));
    const minutes = Math.floor((left % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((left % (60 * 1000)) / 1000);
    
    if (hours > 0) {
      setTimer(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    } else {
      setTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
    
    // Proactive refresh when less than 4 minutes remain and we're online
    if (left < 4 * 60 * 1000 && isOnline && !refreshInProgress) {
      handleAutoRefresh();
    }
  }, [sessionExpiresAt, isOnline, refreshInProgress]);

  // Automatic session refresh
  const handleAutoRefresh = useCallback(async () => {
    if (refreshInProgress) return;
    
    setRefreshInProgress(true);
    try {
      console.log('Auto-refreshing session...');
      await refreshSession();
      console.log('Session auto-refreshed successfully');
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    } finally {
      setTimeout(() => setRefreshInProgress(false), 3000);
    }
  }, [refreshSession, refreshInProgress]);

  // Manual refresh with enhanced feedback
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
      
      console.log('Manual session refresh requested...');
      await refreshSession();
      
      toast({
        title: "Session Refreshed",
        description: "Your session has been successfully refreshed.",
      });
    } catch (error) {
      console.error("Manual session refresh failed:", error);
      
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh your session. Please try signing in again.",
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
    refreshInProgress
  };
};
