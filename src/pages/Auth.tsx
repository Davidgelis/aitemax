
import React, { useState, useEffect, useRef } from 'react';
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

// Simplify the connection health check for better reliability
const useConnectionHealthCheck = (initialCheckOnMount = true) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionHealth, setConnectionHealth] = useState<any>(null);
  const { toast } = useToast();
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionError(null);
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
  
  // Check connection health less frequently (30 seconds) to avoid false negatives
  useEffect(() => {
    if (initialCheckOnMount) {
      checkBasicConnectivity();
    }
    
    // Use a less sensitive approach with longer intervals
    const healthInterval = setInterval(() => {
      if (navigator.onLine) {
        checkBasicConnectivity();
      }
    }, 30000); // Check every 30 seconds instead of 10
    
    return () => clearInterval(healthInterval);
  }, [initialCheckOnMount]);

  // Simplified connectivity check that's less likely to trigger false alarms
  const checkBasicConnectivity = async () => {
    if (!navigator.onLine) {
      setConnectionHealth({ status: 'offline', lastCheck: Date.now() });
      return;
    }
    
    try {
      // First try locally to avoid excessive external requests
      const startTime = Date.now();
      await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(3000) // Shorter timeout for local resources
      });
      
      // If local check passes, we're probably good enough to attempt login
      setConnectionHealth({ status: 'healthy', lastCheck: Date.now() });
      
      // Clear connection error if it was just a temporary glitch
      if (connectionError && connectionError !== "You're offline. Please check your internet connection.") {
        setConnectionError(null);
      }
    } catch (err) {
      console.warn("Basic connectivity check failed, trying alternative:", err);
      
      // Try an external resource as fallback
      try {
        await fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-store',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        });
        
        // If we reach here, we have some connectivity
        setConnectionHealth({ status: 'healthy', lastCheck: Date.now() });
        
        // Clear error if it was just temporary
        if (connectionError) {
          setConnectionError(null);
        }
      } catch (err) {
        console.error("All connectivity checks failed:", err);
        
        // Only update status to degraded after multiple checks to avoid false alarms
        setConnectionHealth({ 
          status: 'degraded', 
          lastCheck: Date.now(),
          consecutive: (connectionHealth?.consecutive || 0) + 1 
        });
        
        // Only show error after multiple consecutive failures
        if ((connectionHealth?.consecutive || 0) >= 2 && !connectionError) {
          setConnectionError(
            "Connection issues detected. You may have trouble logging in. Check your network settings or try again later."
          );
        }
      }
    }
  };

  const handleReconnect = async () => {
    if (reconnecting) return; // Prevent multiple simultaneous reconnection attempts
    
    setReconnecting(true);
    setConnectionError("Attempting to reconnect...");
    setReconnectAttempts(prev => prev + 1);
    
    try {
      // First check basic internet connectivity
      let networkAccessible = false;
      
      try {
        await fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-store',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        });
        
        networkAccessible = true;
      } catch (err) {
        setConnectionError("Network access issues detected. Please check your internet connection.");
        setReconnecting(false);
        return;
      }
      
      if (networkAccessible) {
        // Try to connect to Supabase with a simpler approach
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
    connectionHealth,
    handleReconnect,
    setConnectionError,
    checkBasicConnectivity
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
  const [loginAttemptCount, setLoginAttemptCount] = useState(0);
  
  // Add timeout references to auto-cancel long-running operations
  const loginTimeoutRef = useRef<number | null>(null);
  
  // Use the improved connection health checker
  const { 
    isOnline, 
    connectionError, 
    reconnecting, 
    connectionHealth,
    handleReconnect,
    setConnectionError,
    checkBasicConnectivity
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

  // Cleanup function for timeouts on component unmount
  useEffect(() => {
    return () => {
      // Clear any lingering timeouts when component unmounts
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

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
  
  // Simplified authentication process with timeout and better error handling
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
    setLoginAttemptCount(prev => prev + 1);
    
    // Set a timeout to cancel the loading state after 15 seconds
    // This prevents the button from being stuck in loading state indefinitely
    if (loginTimeoutRef.current) {
      window.clearTimeout(loginTimeoutRef.current);
    }
    
    loginTimeoutRef.current = window.setTimeout(() => {
      if (loading) {
        setLoading(false);
        toast({
          title: "Login Timeout",
          description: "The login attempt timed out. Please try again.",
          variant: "destructive",
        });
      }
    }, 15000); // 15 second timeout
    
    try {
      // First check if we can actually reach Supabase
      await checkBasicConnectivity();
      
      // If the connection health is degraded after multiple attempts, warn the user
      if (connectionHealth?.status === 'degraded' && connectionHealth?.consecutive >= 2) {
        toast({
          title: "Connection Issues Detected",
          description: "You may have trouble logging in. Please check your network.",
          variant: "warning",
        });
      }
      
      if (isLogin) {
        // Login flow with better error handling
        console.log("Attempting to sign in with email:", email);
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ 
            email, 
            password
          });
          
          if (error) {
            throw error;
          }
          
          if (data && data.session) {
            console.log("Login successful, session established");
            
            toast({
              title: "Login Successful",
              description: "Welcome back!",
            });
            
            // Navigate after successful login
            const returnUrl = new URLSearchParams(location.search).get('returnUrl');
            navigate(returnUrl || '/dashboard');
          } else {
            throw new Error("Login successful but no session was created");
          }
        } catch (error: any) {
          console.error("Supabase login error:", error);
          
          // Handle specific error cases
          if (error.message?.includes("Invalid login credentials")) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
            toast({
              title: "Connection Error",
              description: "Unable to connect to authentication service. Please check your internet connection.",
              variant: "destructive",
            });
            setConnectionError("Unable to reach authentication servers. Please check your connection settings.");
          } else {
            toast({
              title: "Login Error",
              description: error.message || "An unexpected error occurred during login",
              variant: "destructive",
            });
          }
          
          throw error; // Re-throw for the outer catch block
        }
      } else {
        // Registration flow with better error handling
        if (!username) {
          setUsernameError(t.errors.usernameRequired);
          throw new Error("Username is required");
        }
        
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setUsernameError(t.errors.usernameTaken);
          throw new Error("Username is already taken");
        }
        
        // Use direct signup with better error tracking
        console.log("Attempting to sign up with email:", email);
        
        try {
          const { data, error } = await supabase.auth.signUp({
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
            throw error;
          }
          
          // Change the app language immediately to the selected one
          await setLanguage(selectedLanguage);
          
          toast({
            title: "Success!",
            description: "Please check your email for verification instructions.",
          });
          setIsLogin(true);
          
        } catch (error: any) {
          console.error("Signup error:", error);
          
          if (error.message?.includes("network") || error.message?.includes("fetch")) {
            toast({
              title: "Connection Error",
              description: "Unable to connect to signup service. Please check your internet connection.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Signup Error",
              description: error.message || "An unexpected error occurred during signup",
              variant: "destructive",
            });
          }
          
          throw error; // Re-throw for the outer catch block
        }
      }
    } catch (error: any) {
      console.error("Authentication process error:", error);
      // Error already handled in inner try-catch blocks
    } finally {
      // Clear the timeout as we've finished the operation
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }
      
      setLoading(false);
    }
  };

  // Add function to retry connection explicitly
  const retryConnection = async () => {
    await checkBasicConnectivity();
    
    toast({
      title: "Connection Check",
      description: "Checking connection to server...",
    });
    
    // Test direct connection to Supabase as well
    try {
      const { data } = await supabase.from('supported_languages').select('id').limit(1);
      if (data) {
        toast({
          title: "Connection Test Successful",
          description: "You should be able to log in now.",
        });
        setConnectionError(null);
      }
    } catch (error) {
      console.error("Supabase connection test failed:", error);
      toast({
        title: "Connection Test Failed",
        description: "Still having issues connecting to our servers.",
        variant: "destructive",
      });
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
        
        {/* Connection status alerts with improved actions */}
        {(!isOnline || connectionError) && (
          <Alert 
            variant={!isOnline ? "destructive" : "warning"} 
            className="mb-4"
          >
            <div className="flex items-start gap-2">
              {!isOnline ? (
                <WifiOff className="h-4 w-4 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 mt-0.5" />
              )}
              <AlertDescription className="flex flex-col gap-2">
                {!isOnline 
                  ? "You appear to be offline. Please check your connection."
                  : connectionError
                }
                
                <div className="flex gap-2 mt-2">
                  {/* Add explicit retry button for better UX */}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={retryConnection} 
                    disabled={!isOnline || reconnecting} 
                    className="self-start"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleReconnect} 
                    disabled={reconnecting || !isOnline} 
                    className="self-start"
                  >
                    {reconnecting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    {reconnecting ? "Reconnecting..." : "Reconnect"}
                  </Button>
                </div>
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
            disabled={loading || (!isOnline && !connectionError) || reconnecting}
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
          
          {/* Add troubleshooting help for multiple failed login attempts */}
          {loginAttemptCount > 2 && (
            <div className="mt-4 text-sm text-gray-500">
              <p className="font-medium">Having trouble logging in?</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Check your email and password</li>
                <li>Make sure you have a stable internet connection</li>
                <li>Try refreshing the page</li>
                <li>Clear your browser cache</li>
              </ul>
            </div>
          )}
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
