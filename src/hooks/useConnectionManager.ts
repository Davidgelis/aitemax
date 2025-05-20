
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

type ConnectionStatus = 'online' | 'offline' | 'degraded' | 'checking';
type ConnectionHealth = {
  status: ConnectionStatus;
  lastChecked: number;
  details?: string;
};

/**
 * A unified connection manager hook that provides a single source of truth
 * for the application's connection status
 */
export const useConnectionManager = () => {
  const [status, setStatus] = useState<ConnectionStatus>(navigator.onLine ? 'online' : 'offline');
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<number>(Date.now());
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState<string>('');
  
  // Browser compatibility check for required features
  const [browserCompatible, setBrowserCompatible] = useState(true);
  
  // Check browser compatibility on mount
  useEffect(() => {
    const compatibilityIssues = [];
    
    // Check for fetch API
    if (!('fetch' in window)) {
      compatibilityIssues.push('Fetch API');
    }
    
    // Check for localStorage
    try {
      localStorage.setItem('connection_test', 'test');
      localStorage.removeItem('connection_test');
    } catch (e) {
      compatibilityIssues.push('LocalStorage');
    }
    
    // Update compatibility status
    if (compatibilityIssues.length > 0) {
      setBrowserCompatible(false);
      setConnectionDetails(`Browser missing required features: ${compatibilityIssues.join(', ')}`);
      
      toast({
        title: "Browser Compatibility Issue",
        description: `Your browser is missing required features: ${compatibilityIssues.join(', ')}. Some functionality may not work correctly.`,
        variant: "destructive",
      });
    }
  }, []);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus('checking');
      checkConnection();
    };
    
    const handleOffline = () => {
      setStatus('offline');
      setConnectionDetails('Browser reports device is offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Simple but reliable connection check
  const checkConnection = useCallback(async (showToast = true): Promise<boolean> => {
    if (!navigator.onLine) {
      setStatus('offline');
      setConnectionDetails('Device is offline according to browser');
      return false;
    }
    
    if (isCheckingConnection) return status === 'online';
    setIsCheckingConnection(true);
    
    try {
      // Use a simple lightweight endpoint for checking connection
      // The fetch itself is what matters, not the response
      const controller = new AbortController();
      let signal;
      
      // AbortController compatibility check
      try {
        signal = controller.signal;
        setTimeout(() => controller.abort(), 5000);
      } catch (e) {
        // Fallback for browsers without AbortController
      }
      
      const response = await fetch('https://xyfwsmblaayznplurmfa.supabase.co/rest/v1/', {
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
        },
        ...(signal ? { signal } : {}),
      });
      
      if (response.ok) {
        // Only show toast when status changes to avoid notification spam
        if (status !== 'online' && showToast) {
          toast({
            title: "Connection Restored",
            description: "Your connection is working properly now.",
          });
        }
        
        setStatus('online');
        setLastSuccessfulConnection(Date.now());
        setConnectionDetails('Connection healthy');
        return true;
      } else {
        setStatus('degraded');
        setConnectionDetails(`Connection issues: Server responded with ${response.status}`);
        
        if (status === 'online' && showToast) {
          toast({
            title: "Connection Issues",
            description: "You may experience problems with the application.",
            variant: "warning",
          });
        }
        return false;
      }
    } catch (error) {
      // Check if this was an abort error (timeout)
      if (error.name === 'AbortError') {
        setStatus('degraded');
        setConnectionDetails('Connection timeout: Server taking too long to respond');
      } else {
        setStatus('offline');
        setConnectionDetails(`Connection error: ${error.message || 'Unknown error'}`);
      }
      
      if (status !== 'offline' && status !== 'degraded' && showToast) {
        toast({
          title: "Connection Lost",
          description: "Please check your internet connection.",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  }, [status, isCheckingConnection]);
  
  // Periodic connection health check
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      // Skip check if user is marked as offline by the browser
      // to avoid unnecessary requests
      if (navigator.onLine && !isCheckingConnection) {
        checkConnection(false); // Don't show toast on routine checks
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(healthCheckInterval);
  }, [checkConnection, isCheckingConnection]);
  
  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);
  
  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isDegraded: status === 'degraded',
    isChecking: isCheckingConnection,
    lastSuccessfulConnection,
    browserCompatible,
    connectionDetails,
    checkConnection: () => checkConnection(true),
    getConnectionHealth: (): ConnectionHealth => ({
      status,
      lastChecked: Date.now(),
      details: connectionDetails
    })
  };
};
