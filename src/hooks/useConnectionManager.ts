
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

type ConnectionStatus = 'online' | 'offline' | 'degraded' | 'checking';
type ConnectionHealth = {
  status: ConnectionStatus;
  lastChecked: number;
  details?: string;
};

/**
 * Enhanced connection manager with better reliability and diagnostics
 */
export const useConnectionManager = () => {
  const [status, setStatus] = useState<ConnectionStatus>(navigator.onLine ? 'checking' : 'offline');
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<number>(Date.now());
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState<string>('Initializing...');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Enhanced connection check with better error handling
  const checkConnection = useCallback(async (showToast = true): Promise<boolean> => {
    if (!navigator.onLine) {
      setStatus('offline');
      setConnectionDetails('Browser reports device is offline');
      return false;
    }
    
    if (isCheckingConnection) return status === 'online';
    setIsCheckingConnection(true);
    
    try {
      setStatus('checking');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('https://xyfwsmblaayznplurmfa.supabase.co/rest/v1/', {
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZndzbWJsYWF5em5wbHVybWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjQ5MzAsImV4cCI6MjA1NjQ0MDkzMH0.iSMjuUMOEGVP-eU7p1xng_XlSc3pNg_DbViVwyD3Fc8',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Accept both 200 OK and 401 Unauthorized as valid responses
      // 401 is expected for HEAD requests to Supabase REST API without proper auth
      const isConnected = response.ok || response.status === 401;
      
      if (isConnected) {
        if (status !== 'online' && showToast && connectionAttempts > 0) {
          toast({
            title: "Connection Restored",
            description: "Your connection is working properly now.",
          });
        }
        
        setStatus('online');
        setLastSuccessfulConnection(Date.now());
        setConnectionDetails('Connection healthy');
        setConnectionAttempts(0);
        return true;
      } else {
        setStatus('degraded');
        setConnectionDetails(`Server responded with ${response.status}: ${response.statusText}`);
        setConnectionAttempts(prev => prev + 1);
        
        if (showToast && connectionAttempts === 0) {
          toast({
            title: "Connection Issues",
            description: "Having trouble connecting to the server.",
            variant: "destructive",
          });
        }
        return false;
      }
    } catch (error: any) {
      console.error('Connection check failed:', error);
      setConnectionAttempts(prev => prev + 1);
      
      if (error.name === 'AbortError') {
        setStatus('degraded');
        setConnectionDetails('Connection timeout: Server taking too long to respond');
      } else {
        setStatus('offline');
        setConnectionDetails(`Connection error: ${error.message || 'Unknown error'}`);
      }
      
      if (showToast && connectionAttempts === 0) {
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
  }, [status, isCheckingConnection, connectionAttempts]);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Browser detected online status');
      checkConnection();
    };
    
    const handleOffline = () => {
      console.log('Browser detected offline status');
      setStatus('offline');
      setConnectionDetails('Browser reports device is offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);
  
  // Initial connection check and periodic health checks
  useEffect(() => {
    checkConnection(false); // Don't show toast on initial check
    
    const healthCheckInterval = setInterval(() => {
      if (navigator.onLine && !isCheckingConnection) {
        checkConnection(false);
      }
    }, 45000); // Check every 45 seconds
    
    return () => clearInterval(healthCheckInterval);
  }, [checkConnection, isCheckingConnection]);
  
  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isDegraded: status === 'degraded',
    isChecking: isCheckingConnection,
    lastSuccessfulConnection,
    connectionDetails,
    connectionAttempts,
    checkConnection: () => checkConnection(true),
    getConnectionHealth: (): ConnectionHealth => ({
      status,
      lastChecked: Date.now(),
      details: connectionDetails
    })
  };
};
