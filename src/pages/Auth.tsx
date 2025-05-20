
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase, checkConnection } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/translations/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, RefreshCw, Wifi, WifiOff, AlertTriangle, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Simplified connection health check - focused on core functionality
const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const { toast } = useToast();
  
  // Listen for online/offline events from the browser
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionError(null);
      toast({
        title: "Connection Restored",
        description: "Your internet connection has been restored.",
      });
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

  // Use Supabase's own connectivity check instead of Google favicon
  const handleReconnect = async () => {
    if (reconnecting) return;
    
    setReconnecting(true);
    setConnectionError("Attempting to reconnect to Supabase...");
    
    try {
      // Use the checkConnection function that targets Supabase directly
      const isConnected = await checkConnection();
      
      if (isConnected) {
        toast({
          title: "Connection Test Successful",
          description: "Connection to authentication servers established.",
        });
        setConnectionError(null);
      } else {
        setConnectionError("Cannot reach Supabase servers. Please check your connection.");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionError("Connection issues detected. You may have trouble logging in.");
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
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Add timeout reference to cancel long-running operations
  const loginTimeoutRef = useRef<number | null>(null);
  
  // Use connection status hook
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

  // Check if we can connect to Supabase on initial load
  useEffect(() => {
    const initialConnectionCheck = async () => {
      try {
        const connected = await checkConnection();
        if (!connected && navigator.onLine) {
          setConnectionError("Cannot connect to authentication servers. Please check firewall or network settings.");
        }
      } catch (error) {
        console.error("Initial connection check failed:", error);
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

  // Cleanup function for timeouts on component unmount
  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

  // Simplified username availability check
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
  
  // Simplified authentication process with improved error handling
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setAuthError(null);
    
    // Prevent authentication if offline
    if (!isOnline) {
      setAuthError("You're offline. Please check your internet connection before logging in.");
      return;
    }
    
    setLoading(true);
    setUsernameError('');
    
    // Set a shorter timeout to cancel the loading state after 10 seconds
    if (loginTimeoutRef.current) {
      window.clearTimeout(loginTimeoutRef.current);
    }
    
    loginTimeoutRef.current = window.setTimeout(() => {
      setLoading(false);
      setAuthError("Login attempt timed out. Please try again.");
      toast({
        title: "Login Timeout",
        description: "The login attempt timed out. Please try again.",
        variant: "destructive",
      });
    }, 10000); // 10 second timeout
    
    try {
      console.log(`Attempting to ${isLogin ? 'sign in' : 'sign up'} with email: ${email}`);
      
      if (isLogin) {
        // Login flow with direct call to auth context
        const { error } = await signIn(email, password, rememberMe);
        
        if (error) {
          console.error("Login error:", error);
          
          // ENSURE LOADING STATE IS CLEARED IMMEDIATELY ON ERROR
          setLoading(false);
          
          if (error.message?.includes("Invalid login credentials")) {
            setAuthError("Invalid email or password. Please try again.");
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
            setAuthError("Unable to reach authentication servers. Please check your connection.");
            toast({
              title: "Connection Error",
              description: "Unable to connect to authentication service. Please check your internet connection.",
              variant: "destructive",
            });
            setConnectionError("Unable to reach authentication servers. Please check your connection.");
            
            // Try to recover connection
            try {
              const reconnected = await reconnect();
              if (reconnected) {
                setAuthError("Connection recovered. Please try logging in again.");
                toast({
                  title: "Connection Restored",
                  description: "Please try logging in again.",
                });
              }
            } catch (reconnectError) {
              console.error("Reconnection failed:", reconnectError);
            }
          } else {
            setAuthError(error.message || "An unexpected error occurred during login");
            toast({
              title: "Login Error",
              description: error.message || "An unexpected error occurred during login",
              variant: "destructive",
            });
          }
          
          // No need to set loading false here, it's already done above for errors
        } else {
          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });
          
          // Navigate handled by session effect
          // But clear error state
          setAuthError(null);
        }
      } else {
        // Registration flow
        if (!username) {
          setUsernameError(t.errors.usernameRequired);
          setLoading(false); // Clear loading immediately
          throw new Error("Username is required");
        }
        
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setUsernameError(t.errors.usernameTaken);
          setLoading(false); // Clear loading immediately
          throw new Error("Username is already taken");
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
          
          // ENSURE LOADING STATE IS CLEARED IMMEDIATELY ON ERROR
          setLoading(false);
          
          if (error.message?.includes("network") || error.message?.includes("fetch")) {
            setAuthError("Unable to connect to signup service. Please check your connection.");
            toast({
              title: "Connection Error",
              description: "Unable to connect to signup service. Please check your internet connection.",
              variant: "destructive",
            });
            
            // Try to recover connection
            try {
              const reconnected = await reconnect();
              if (reconnected) {
                setAuthError("Connection recovered. Please try signing up again.");
              }
            } catch (reconnectError) {
              console.error("Reconnection failed:", reconnectError);
            }
          } else {
            setAuthError(error.message || "An unexpected error occurred during signup");
            toast({
              title: "Signup Error",
              description: error.message || "An unexpected error occurred during signup",
              variant: "destructive",
            });
          }
          
          // No need to set loading false here, it's already done above for errors
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
      console.error("Authentication process error:", error);
      
      // ENSURE LOADING STATE IS CLEARED IMMEDIATELY ON ERROR
      setLoading(false);
      
      setAuthError(error.message || "An unexpected authentication error occurred");
      
      // Most errors handled in inner try-catch blocks
    } finally {
      // Clear the timeout as we've finished the operation
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }
      
      // Make absolutely sure loading is false when done
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
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleReconnect} 
                  disabled={reconnecting || !isOnline} 
                  className="self-start mt-2"
                >
                  {reconnecting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  {reconnecting ? "Checking connection..." : "Test Connection"}
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {/* Persistent auth error message */}
        {authError && (
          <Alert 
            variant="destructive" 
            className="mb-4"
          >
            <AlertDescription className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {authError}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Connection indicator */}
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
          
          {/* Simplified disabled logic */}
          <Button 
            type="submit" 
            className="w-full aurora-button" 
            disabled={loading || !isOnline || reconnecting}
          >
            {loading ? (
              <span className="flex items-center">
                <Loader className="animate-spin mr-2 h-4 w-4" />
                {t.processing}
              </span>
            ) : (
              isLogin ? t.loginCta : t.signUpCta
            )}
          </Button>
          
          {/* Helpful debugging information */}
          <div className="mt-4 text-sm text-gray-500">
            <p className="font-medium">Having trouble logging in?</p>
            <ul className="list-disc pl-5 mt-1">
              <li>Check your email and password</li>
              <li>Make sure you have a stable internet connection</li>
              <li>Try refreshing the page</li>
              <li>Clear your browser cache</li>
            </ul>
          </div>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setUsernameError('');
              setUsername('');
              setAuthError(null);
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
