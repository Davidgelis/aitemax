
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase, checkConnection, refreshSupabaseConnection } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/translations/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, RefreshCw, Wifi, WifiOff, AlertTriangle, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Simplified connection health check with better error recovery
const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const { toast } = useToast();
  
  // Listen for online/offline events from the browser
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Don't immediately clear connection error - we need to verify Supabase is actually reachable
      setTimeout(async () => {
        const connected = await checkConnection();
        if (connected) {
          setConnectionError(null);
          toast({
            title: "Connection Restored",
            description: "Your internet connection has been restored.",
          });
        }
      }, 1500); // Small delay to allow network to stabilize
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
  }, [toast]);

  // Improved reconnection logic with proper error handling
  const handleReconnect = async () => {
    if (reconnecting) return;
    
    setReconnecting(true);
    setConnectionError("Attempting to reconnect to authentication servers...");
    
    try {
      // First try the more complete reconnection method that handles session state
      const fullReconnected = await refreshSupabaseConnection();
      
      if (fullReconnected) {
        toast({
          title: "Connection Restored",
          description: "Successfully reconnected to authentication servers.",
        });
        setConnectionError(null);
      } else {
        // Fall back to a basic connection check
        const basicConnected = await checkConnection();
        
        if (basicConnected) {
          toast({
            title: "Limited Connection Available",
            description: "Basic connection restored, but you may experience limited functionality.",
          });
          setConnectionError("Limited connection available. You may need to retry login.");
        } else {
          setConnectionError("Cannot reach authentication servers. Please check your network settings or try again later.");
        }
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionError("Connection issues detected. Please check your network or firewall settings.");
    } finally {
      setReconnecting(false);
    }
  };
  
  return {
    isOnline,
    connectionError,
    reconnecting,
    handleReconnect,
    setConnectionError
  };
};

// The main Auth component with improved error handling
const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastLoginAttempt, setLastLoginAttempt] = useState(0);
  
  // Add timeout reference to cancel long-running operations
  const loginTimeoutRef = useRef<number | null>(null);
  const maxRetries = useRef(2);
  const retryCount = useRef(0);
  
  // Use connection status hook with improved behavior
  const { 
    isOnline, 
    connectionError, 
    reconnecting, 
    handleReconnect,
    setConnectionError
  } = useConnectionStatus();
  
  const { signIn, signUp, session, reconnect } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentLanguage, languages, setLanguage } = useLanguage();
  const t = authTranslations[currentLanguage as keyof typeof authTranslations] || authTranslations.en;

  // More reliable initial connection check
  useEffect(() => {
    const initialConnectionCheck = async () => {
      if (!navigator.onLine) {
        setConnectionError("You're offline. Please check your internet connection.");
        return;
      }
      
      try {
        // Use a short timeout for initial check to avoid blocking UI
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const connected = await checkConnection();
        clearTimeout(timeoutId);
        
        if (!connected) {
          setConnectionError("Cannot connect to authentication servers. Please check your network settings.");
        }
      } catch (error) {
        console.error("Initial connection check failed:", error);
        setConnectionError("Connection check failed. You may experience issues with authentication.");
      }
    };
    
    initialConnectionCheck();
  }, []);

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

  // Enhanced cleanup function for timeouts on component unmount
  useEffect(() => {
    return () => {
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
        return true; // Assume available if check fails to avoid blocking signup
      }
      
      return data === null;
    } catch (error) {
      console.error("Error checking username availability:", error);
      return true; // Assume available if check fails
    }
  };
  
  // Improved retry handling for login attempts
  const retryLoginWithBackoff = async () => {
    if (retryCount.current >= maxRetries.current) {
      console.log("Max retries reached, giving up");
      setLoading(false);
      setAuthError("Login failed after multiple attempts. Please try again later.");
      return;
    }
    
    const backoffTime = Math.pow(2, retryCount.current) * 1000;
    console.log(`Retrying login after ${backoffTime}ms (attempt ${retryCount.current + 1}/${maxRetries.current})`);
    
    toast({
      title: "Retrying Connection",
      description: `Attempting to reconnect (${retryCount.current + 1}/${maxRetries.current})...`,
    });
    
    retryCount.current++;
    
    // Wait for backoff time before retry
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    
    // Try to reconnect first
    const reconnected = await refreshSupabaseConnection();
    
    if (reconnected) {
      toast({
        title: "Connection Restored",
        description: "Retrying your login request...",
      });
      
      // Retry the login
      handleAuth(null, true);
    } else {
      setLoading(false);
      setAuthError("Cannot establish connection to authentication servers. Please try again later.");
    }
  };
  
  // Complete reset of auth state for a fresh attempt
  const resetAuthState = () => {
    setAuthError(null);
    retryCount.current = 0;
    setLoading(false);
    if (loginTimeoutRef.current) {
      window.clearTimeout(loginTimeoutRef.current);
      loginTimeoutRef.current = null;
    }
  };
  
  // Improved authentication process with better error recovery
  const handleAuth = async (e: React.FormEvent | null, isRetry = false) => {
    if (e) e.preventDefault();
    
    // Prevent rapid repeated login attempts
    const now = Date.now();
    if (!isRetry && now - lastLoginAttempt < 2000) {
      console.log("Throttling login attempts");
      return;
    }
    setLastLoginAttempt(now);
    
    // Reset error states
    setAuthError(null);
    
    // Always clear previous timeouts to avoid race conditions
    if (loginTimeoutRef.current) {
      window.clearTimeout(loginTimeoutRef.current);
    }
    
    // Prevent authentication if offline
    if (!isOnline) {
      setAuthError("You're offline. Please check your internet connection before logging in.");
      return;
    }
    
    setLoading(true);
    setUsernameError('');
    
    // Set a longer timeout (15s) to allow for slower connections but still provide feedback
    loginTimeoutRef.current = window.setTimeout(() => {
      // This will only trigger if the authentication hasn't completed within the timeout
      setLoading(false);
      setAuthError("Login attempt timed out. Please try again.");
      
      // Only show toast if we haven't already reset the loading state elsewhere
      if (loading) {
        toast({
          title: "Login Timeout",
          description: "The server took too long to respond. Please try again.",
          variant: "destructive",
        });
      }
    }, 15000);
    
    try {
      console.log(`Attempting to ${isLogin ? 'sign in' : 'sign up'} with email: ${email}`);
      
      if (isLogin) {
        // Login flow with improved error handling
        const { error } = await signIn(email, password, rememberMe);
        
        if (error) {
          console.error("Login error:", error);
          
          // IMMEDIATELY clear loading state on any error
          setLoading(false);
          
          if (error.message?.includes("Invalid login credentials")) {
            setAuthError("Invalid email or password. Please try again.");
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else if (error.message?.includes("network") || 
                     error.message?.includes("fetch") || 
                     error.message?.includes("timeout") ||
                     error.message?.includes("aborted")) {
            
            setAuthError("Connection issues detected. Attempting to reconnect...");
            
            // Attempt automatic retry with backoff
            retryLoginWithBackoff();
          } else {
            setAuthError(error.message || "An unexpected error occurred during login");
            toast({
              title: "Login Error",
              description: error.message || "An unexpected error occurred during login",
              variant: "destructive",
            });
          }
        } else {
          // Success case - already handled by session effect
          resetAuthState();
          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });
        }
      } else {
        // Registration flow with improved validation
        if (!username) {
          setUsernameError(t.errors.usernameRequired);
          setLoading(false); // Clear loading immediately
          return;
        }
        
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setUsernameError(t.errors.usernameTaken);
          setLoading(false); // Clear loading immediately
          return;
        }
        
        // Use signUp from auth context
        const { error } = await signUp(email, password, {
          data: { 
            username,
            preferred_language: selectedLanguage
          }
        });
        
        if (error) {
          console.error("Signup error:", error);
          
          // IMMEDIATELY clear loading state on any error
          setLoading(false);
          
          if (error.message?.includes("network") || 
             error.message?.includes("fetch") || 
             error.message?.includes("timeout")) {
             
            setAuthError("Connection issues detected. Please try again when your connection is stable.");
            toast({
              title: "Connection Error",
              description: "Unable to complete signup. Please check your connection.",
              variant: "destructive",
            });
          } else {
            setAuthError(error.message || "An unexpected error occurred during signup");
            toast({
              title: "Signup Error",
              description: error.message || "An unexpected error occurred during signup",
              variant: "destructive",
            });
          }
        } else {
          // Change the app language immediately to the selected one
          resetAuthState();
          await setLanguage(selectedLanguage);
          
          toast({
            title: "Success!",
            description: "Please check your email for verification instructions.",
          });
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error("Authentication process error:", error);
      
      // IMMEDIATELY clear loading state on any error
      setLoading(false);
      
      setAuthError(error.message || "An unexpected authentication error occurred");
    } finally {
      // Clear the timeout as we've finished the operation
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }
      
      // Make absolutely sure loading is false when done (unless we're in retry mode)
      if (!isRetry) {
        setLoading(false);
      }
    }
  };

  // Improved manual retry logic
  const handleManualRetry = async () => {
    if (loading) return;
    
    resetAuthState();
    setAuthError("Attempting to reconnect...");
    
    try {
      const reconnected = await refreshSupabaseConnection();
      
      if (reconnected) {
        toast({
          title: "Connection Restored",
          description: "Please try logging in again.",
        });
        setAuthError(null);
      } else {
        setAuthError("Still unable to connect. Please check your network settings and try again.");
      }
    } catch (error) {
      console.error("Manual reconnection failed:", error);
      setAuthError("Reconnection failed. Please try again later.");
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
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleReconnect} 
                    disabled={reconnecting || !isOnline} 
                    className="self-start"
                  >
                    {reconnecting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    {reconnecting ? "Checking..." : "Test Connection"}
                  </Button>
                  
                  {connectionError && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleManualRetry} 
                      disabled={loading || reconnecting || !isOnline} 
                      className="self-start"
                    >
                      Retry Login
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {/* Persistent auth error message with retry action */}
        {authError && (
          <Alert 
            variant="destructive" 
            className="mb-4"
          >
            <AlertDescription className="flex flex-col">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{authError}</span>
              </div>
              
              {authError.includes("connection") || authError.includes("network") || authError.includes("timeout") ? (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleManualRetry} 
                  disabled={loading || reconnecting} 
                  className="self-start mt-2"
                >
                  Retry Connection
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Connection indicator with clearer status */}
        <div className="flex items-center justify-end mb-4">
          <span className="text-sm flex items-center">
            {reconnecting ? (
              <><RefreshCw className="w-4 h-4 text-amber-500 animate-spin mr-1" /> Connecting...</>
            ) : isOnline ? (
              <><Wifi className="w-4 h-4 text-green-500 mr-1" /> Connected</>
            ) : (
              <><WifiOff className="w-4 h-4 text-red-500 mr-1" /> Offline</>
            )}
          </span>
        </div>
        
        <form onSubmit={(e) => handleAuth(e)} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
              disabled={loading || reconnecting}
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
                  disabled={loading || reconnecting}
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
                  disabled={loading || reconnecting}
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
              disabled={loading || reconnecting}
            />
          </div>
          
          {isLogin && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="rememberMe" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={loading || reconnecting}
              />
              <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                {t.keepSignedIn}
              </Label>
            </div>
          )}
          
          {/* Simplified disabled logic */}
          <Button 
            type="submit" 
            className="w-full aurora-button" 
            disabled={loading || !isOnline || reconnecting}
          >
            {loading ? (
              <span className="flex items-center">
                <Loader className="animate-spin mr-2 h-4 w-4" />
                {reconnecting || retryCount.current > 0 ? 
                  `Retrying (${retryCount.current}/${maxRetries.current})...` : 
                  t.processing}
              </span>
            ) : (
              isLogin ? t.loginCta : t.signUpCta
            )}
          </Button>
          
          {/* Helpful troubleshooting tips */}
          <div className="mt-4 text-sm text-gray-500">
            <p className="font-medium">Having trouble logging in?</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Check your email and password</li>
              <li>Make sure you have a stable internet connection</li>
              <li>Try disabling VPN or proxy services if you're using them</li>
              <li>Try using a different browser or device</li>
              <li>Clear your browser cache and cookies</li>
            </ul>
          </div>
        </form>
        
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setUsernameError('');
              setUsername('');
              setAuthError(null);
              resetAuthState();
            }}
            className="text-sm text-[#545454] hover:underline"
            disabled={loading || reconnecting}
          >
            {isLogin ? t.switchToSignUp : t.switchToLogin}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
