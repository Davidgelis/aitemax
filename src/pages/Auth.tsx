import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase, refreshSupabaseConnection, getConnectionHealth } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/translations/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, RefreshCw, Wifi, WifiOff, AlertTriangle, LucideLoader, Signal } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [initialConnectionCheck, setInitialConnectionCheck] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<any>(null);
  
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentLanguage, languages, setLanguage } = useLanguage();
  const t = authTranslations[currentLanguage as keyof typeof authTranslations] || authTranslations.en;
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionError("Reconnected to network. Checking server connection...");
      // When coming back online automatically try to reconnect
      handleReconnect();
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

  // Check connection health periodically
  useEffect(() => {
    const checkHealth = () => {
      const health = getConnectionHealth();
      setConnectionHealth(health);
      
      // If connection is degraded for more than 30 seconds, show error
      if (health.status === 'degraded' && health.timeSinceSuccess > 30000) {
        setConnectionError(`Connection issues detected. Last successful connection was ${Math.floor(health.timeSinceSuccess/1000)} seconds ago.`);
      } else if (health.status === 'healthy' && connectionError) {
        setConnectionError(null);
      }
    };
    
    const healthInterval = setInterval(checkHealth, 5000);
    return () => clearInterval(healthInterval);
  }, [connectionError]);

  // Perform an initial connection check when the component loads
  useEffect(() => {
    const initialCheck = async () => {
      try {
        // First check if we're online
        if (!navigator.onLine) {
          setConnectionError("You appear to be offline. Please check your internet connection.");
          return;
        }
        
        setInitialConnectionCheck(true);
        
        // Test basic connectivity first
        try {
          await fetch(`${SUPABASE_URL}/auth/v1/`, { 
            method: 'HEAD',
            headers: {
              'apikey': SUPABASE_PUBLISHABLE_KEY
            }
          });
        } catch (err) {
          console.error("Initial endpoint check failed:", err);
          setConnectionError("Unable to reach authentication servers. Please check your connection.");
          setInitialConnectionCheck(false);
          return;
        }
        
        const success = await refreshSupabaseConnection();
        setInitialConnectionCheck(false);
        
        if (!success) {
          setConnectionError("Unable to connect to our servers. Please check your connection and try again.");
        } else {
          setConnectionError(null);
        }
      } catch (error) {
        setInitialConnectionCheck(false);
        console.error("Initial connection check failed:", error);
        setConnectionError("Error checking connection to our servers.");
      }
    };
    
    initialCheck();
  }, []);

  const handleReconnect = async () => {
    if (reconnecting) return; // Prevent multiple simultaneous reconnection attempts
    
    setReconnecting(true);
    setConnectionError("Attempting to reconnect...");
    setReconnectAttempts(prev => prev + 1);
    
    try {
      // First try to ping the Supabase endpoint directly
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/`, { 
          method: 'HEAD',
          headers: {
            'apikey': SUPABASE_PUBLISHABLE_KEY
          }
        });
        console.log("Basic Supabase endpoint check successful");
      } catch (err) {
        console.error("Endpoint check failed:", err);
        setConnectionError("Unable to reach authentication servers. Please check your network settings.");
        setReconnecting(false);
        return;
      }
      
      const success = await refreshSupabaseConnection();
      if (success) {
        toast({
          title: "Connection Restored",
          description: "Successfully reconnected to the server.",
        });
        setConnectionError(null);
        setReconnectAttempts(0);
      } else {
        if (reconnectAttempts >= 3) {
          setConnectionError("Unable to establish a stable connection after multiple attempts. Please try again later.");
        } else {
          setConnectionError("Unable to connect to the server. Please check your internet connection and try again.");
        }
      }
    } catch (error) {
      console.error("Reconnection error:", error);
      setConnectionError("Failed to reconnect. Please try again later or refresh the page.");
    } finally {
      setReconnecting(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!isOnline) {
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        // No data found means username is available
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking username availability:", error);
      // If we can't check, we'll assume it's available and let server validation handle it
      return true;
    }
  };

  // Define constants for Supabase URL and key since we need them in the component
  const SUPABASE_URL = "https://xyfwsmblaayznplurmfa.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZndzbWJsYWF5em5wbHVybWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjQ5MzAsImV4cCI6MjA1NjQ0MDkzMH0.iSMjuUMOEGVP-eU7p1xng_XlSc3pNg_DbViVwyD3Fc8";
  
  // Allow direct access to the auth API for login/signup
  // This provides more control and better error handling than going through hooks
  const handleDirectAuth = async (e: React.FormEvent) => {
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
    // Clear connection error to provide fresh feedback
    setConnectionError(null);
    
    try {
      if (isLogin) {
        // Try a direct fetch to bypass potential hooks issues
        const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        if (!loginResponse.ok) {
          const errorData = await loginResponse.json();
          
          // Check if it's an invalid credentials error
          if (loginResponse.status === 400 && errorData.error === 'invalid_grant') {
            throw new Error("Invalid email or password. Please try again.");
          }
          
          // Check if it's a server error
          if (loginResponse.status >= 500) {
            throw new Error("Server error. Please try again later.");
          }
          
          // Other errors
          throw new Error(errorData.error_description || "Login failed");
        }
        
        // Login successful, get the session with supabase client
        await supabase.auth.signInWithPassword({ email, password });
        
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
      if (error.message?.includes("invalid") || error.message?.includes("Invalid email or password")) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      } else if (error.message?.includes("network") || error.message?.includes("connect") || error.message?.includes("Connection error")) {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to authentication service. Please check your internet connection.",
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
        
        {/* Connection quality indicator */}
        <div className="flex items-center justify-end mb-4">
          {connectionHealth && (
            <span className="text-sm mr-2">
              {connectionHealth.status === 'healthy' ? 'Connection quality: ' : 'Connection issues: '}
              <span className={connectionHealth.status === 'healthy' ? 'text-green-600' : 'text-amber-500'}>
                {connectionHealth.status === 'healthy' ? 'Good' : 'Degraded'}
              </span>
            </span>
          )}
          <span className="text-sm flex items-center">
            {isOnline ? (
              <><Wifi className="w-4 h-4 text-green-500 mr-1" /> Connected</>
            ) : (
              <><WifiOff className="w-4 h-4 text-red-500 mr-1" /> Offline</>
            )}
          </span>
        </div>
        
        <form onSubmit={handleDirectAuth} className="space-y-4">
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
