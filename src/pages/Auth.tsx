
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase, refreshSupabaseConnection } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/translations/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, RefreshCw, Wifi, WifiOff, AlertTriangle, LucideLoader, Signal } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Extract the health check logic to make it reusable with improved stability
const useConnectionHealthCheck = (initialCheckOnMount = true) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [initialConnectionCheck, setInitialConnectionCheck] = useState(initialCheckOnMount);
  const [connectionHealth, setConnectionHealth] = useState<any>(null);
  const { toast } = useToast();
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionError(null);
      
      // When coming back online, delay the reconnection attempt slightly
      setTimeout(() => {
        if (navigator.onLine) {
          handleReconnect();
        }
      }, 1000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionError("You're offline. Please check your internet connection.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Check connection health less frequently to avoid false negatives
  useEffect(() => {
    // Use a less sensitive approach to determine connection health
    const checkHealth = async () => {
      if (!navigator.onLine) {
        setConnectionHealth({ status: 'offline', lastCheck: Date.now() });
        return;
      }
      
      try {
        const response = await fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-store',
          mode: 'no-cors',
          signal: AbortSignal.timeout(2000)
        });
        
        // If we can reach a common resource, basic connectivity is good
        setConnectionHealth({ status: 'healthy', lastCheck: Date.now() });
        
        // If there was a previous connection error but now we can connect, clear it
        if (connectionError && connectionError !== "You're offline. Please check your internet connection.") {
          setConnectionError(null);
        }
      } catch (err) {
        console.warn("Basic connectivity check failed:", err);
        
        // Only consider the connection degraded after multiple consecutive failures
        if (connectionHealth?.status === 'degraded') {
          setConnectionHealth({ 
            status: 'degraded', 
            lastCheck: Date.now(),
            consecutive: (connectionHealth.consecutive || 1) + 1 
          });
          
          // Only show error after multiple consecutive failures to reduce false alarms
          if (connectionHealth.consecutive >= 2 && !connectionError) {
            setConnectionError("Connection issues detected. You may experience difficulty connecting to our servers.");
          }
        } else {
          // First failure, just mark as potentially degraded
          setConnectionHealth({ 
            status: 'degraded', 
            lastCheck: Date.now(),
            consecutive: 1
          });
        }
      }
    };
    
    // Run initial check
    if (initialCheckOnMount) {
      checkHealth();
      setInitialConnectionCheck(false);
    }
    
    // Check less frequently (every 10 seconds is sufficient)
    const healthInterval = setInterval(checkHealth, 10000);
    return () => clearInterval(healthInterval);
  }, [connectionHealth, connectionError, initialCheckOnMount]);

  const handleReconnect = async () => {
    if (reconnecting) return; // Prevent multiple simultaneous reconnection attempts
    
    setReconnecting(true);
    setConnectionError("Attempting to reconnect...");
    setReconnectAttempts(prev => prev + 1);
    
    try {
      // First check basic connectivity with a lightweight request
      let networkAccessible = false;
      
      try {
        const response = await fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-store',
          mode: 'no-cors',
          signal: AbortSignal.timeout(2000)
        });
        
        networkAccessible = true;
      } catch (err) {
        console.warn("Basic internet connectivity check failed:", err);
        setConnectionError("Network access issues detected. Please check your internet connection.");
        setReconnecting(false);
        return;
      }
      
      if (networkAccessible) {
        // Then try to connect to Supabase with a simpler approach
        const success = await refreshSupabaseConnection();
        
        if (success) {
          toast({
            title: "Connection Restored",
            description: "Successfully reconnected to the server.",
          });
          setConnectionError(null);
          setReconnectAttempts(0);
          setConnectionHealth({ status: 'healthy', lastCheck: Date.now() });
        } else {
          setConnectionError("Unable to establish a connection to our servers. You can still try signing in.");
        }
      }
    } catch (error) {
      console.error("Reconnection error:", error);
      setConnectionError("Failed to reconnect. Please try refreshing the page.");
    } finally {
      setReconnecting(false);
    }
  };
  
  return {
    isOnline,
    connectionError,
    reconnecting,
    reconnectAttempts,
    initialConnectionCheck,
    connectionHealth,
    handleReconnect,
    setConnectionError
  };
};

// The main Auth component
const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // Use the improved connection health checker
  const { 
    isOnline, 
    connectionError, 
    reconnecting, 
    initialConnectionCheck, 
    connectionHealth,
    handleReconnect,
    setConnectionError
  } = useConnectionHealthCheck(true);
  
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentLanguage, languages, setLanguage } = useLanguage();
  const t = authTranslations[currentLanguage as keyof typeof authTranslations] || authTranslations.en;

  // Automatically redirect if session exists
  useEffect(() => {
    if (session) {
      const returnUrl = new URLSearchParams(location.search).get('returnUrl');
      navigate(returnUrl || '/dashboard');
    }
  }, [session, navigate, location.search]);

  // Set the default selected language to match the current app language
  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  // Simplified username availability check with better error handling
  const checkUsernameAvailability = async (username: string) => {
    if (!isOnline) {
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        console.error("Error checking username:", error);
        // Don't fail the signup process because of this check
        return true; 
      }
      
      // If data is null, username is available
      return data === null;
    } catch (error) {
      console.error("Error checking username availability:", error);
      // If we can't check, we'll assume it's available and let server validation handle it
      return true;
    }
  };
  
  // Simplified authentication process with more stable error handling
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      toast({
        title: "You're offline",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setUsernameError('');
    
    try {
      if (isLogin) {
        // Login flow - use a simple, reliable approach
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password
        });
        
        if (error) {
          console.error("Login error:", error);
          
          if (error.message?.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please try again.");
          } else if (error.message?.includes("network")) {
            throw new Error("Connection error. Please check your internet connection and try again.");
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });
          
          // Navigate after successful login
          const returnUrl = new URLSearchParams(location.search).get('returnUrl');
          navigate(returnUrl || '/dashboard');
        }
      } else {
        // Registration flow
        // Check username availability before signup
        if (!username) {
          setUsernameError(t.errors.usernameRequired);
          setLoading(false);
          return;
        }
        
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setUsernameError(t.errors.usernameTaken);
          setLoading(false);
          return;
        }
        
        // Use direct signup
        const { error } = await supabase.auth.signUp({
          email, 
          password,
          options: {
            data: { 
              username,
              preferred_language: selectedLanguage
            }
          }
        });
        
        if (error) {
          if (error.message?.includes("network") || error.message?.includes("fetch")) {
            throw new Error("Connection error. Please check your internet and try again.");
          }
          throw error;
        } else {
          // Change the app language immediately to the selected one
          await setLanguage(selectedLanguage);
          
          toast({
            title: "Success!",
            description: "Please check your email for verification instructions.",
          });
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      // Better error classification
      if (error.message?.includes("Invalid") || error.message?.includes("invalid") || error.message?.includes("password")) {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      } else if (error.message?.includes("network") || error.message?.includes("connect") || error.message?.includes("Connection")) {
        toast({
          title: "Connection Failed",
          description: error.message || "Unable to connect to authentication service. Please check your internet connection.",
          variant: "destructive",
        });
        setConnectionError("Unable to reach authentication servers. Please check your connection settings.");
      } else {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#fafafa]">
      {/* Aurora background overlay */}
      <div 
        className="fixed inset-0 bg-aurora-gradient bg-aurora animate-aurora opacity-15 pointer-events-none"
        style={{ zIndex: -1 }}
      />
      
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        
        <h2 className="text-2xl font-semibold text-center mb-6 text-[#545454]">
          {isLogin ? t.login : t.signUp}
        </h2>
        
        {/* Connection status alerts with more detailed info */}
        {(!isOnline || connectionError || initialConnectionCheck) && (
          <Alert 
            variant={!isOnline ? "destructive" : connectionError ? "warning" : "default"} 
            className="mb-4"
          >
            <div className="flex items-start gap-2">
              {!isOnline ? (
                <WifiOff className="h-4 w-4 mt-0.5" />
              ) : connectionError ? (
                <AlertTriangle className="h-4 w-4 mt-0.5" />
              ) : (
                <LucideLoader className="h-4 w-4 mt-0.5 animate-spin" />
              )}
              <AlertDescription className="flex flex-col gap-2">
                {!isOnline ? (
                  "You appear to be offline. Please check your connection."
                ) : initialConnectionCheck ? (
                  "Checking connection to server..."
                ) : (
                  connectionError
                )}
                {(isOnline && !initialConnectionCheck) && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleReconnect} 
                    disabled={reconnecting || !isOnline} 
                    className="self-start mt-2"
                  >
                    {reconnecting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    {reconnecting ? "Reconnecting..." : "Try Again"}
                  </Button>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {/* Connection quality indicator - simplified */}
        <div className="flex items-center justify-end mb-4">
          <span className="text-sm flex items-center">
            {isOnline ? (
              <><Wifi className="w-4 h-4 text-green-500 mr-1" /> Connected</>
            ) : (
              <><WifiOff className="w-4 h-4 text-red-500 mr-1" /> Offline</>
            )}
          </span>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
          
          {!isLogin && (
            <>
              <div>
                <Input
                  type="text"
                  placeholder={t.username}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError('');
                  }}
                  className="w-full"
                  required
                />
                {usernameError && (
                  <p className="text-sm text-red-500 mt-1">{usernameError}</p>
                )}
              </div>

              <div>
                <Label htmlFor="language" className="text-sm text-gray-600 mb-1 block">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Language
                </Label>
                <Select 
                  value={selectedLanguage} 
                  onValueChange={setSelectedLanguage}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.flag_emoji} {lang.name} ({lang.native_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>
          
          {isLogin && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="rememberMe" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                {t.keepSignedIn}
              </Label>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full aurora-button" 
            disabled={loading || (!isOnline && !connectionError) || reconnecting || initialConnectionCheck}
          >
            {loading ? (
              <span className="flex items-center">
                <LucideLoader className="animate-spin mr-2 h-4 w-4" />
                {t.processing}
              </span>
            ) : (
              isLogin ? t.loginCta : t.signUpCta
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setUsernameError('');
              setUsername('');
            }}
            className="text-sm text-[#545454] hover:underline"
          >
            {isLogin ? t.switchToSignUp : t.switchToLogin}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
