
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
import { Globe, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
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
  
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentLanguage, languages, setLanguage } = useLanguage();
  const t = authTranslations[currentLanguage as keyof typeof authTranslations] || authTranslations.en;
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
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

  const handleReconnect = async () => {
    setReconnecting(true);
    setConnectionError(null);
    
    try {
      const success = await refreshSupabaseConnection();
      if (success) {
        toast({
          title: "Connection Restored",
          description: "Successfully reconnected to the server.",
        });
        setConnectionError(null);
      } else {
        setConnectionError("Unable to connect to the server. Please check your internet connection and try again.");
      }
    } catch (error) {
      setConnectionError("Failed to reconnect. Please try again later.");
    } finally {
      setReconnecting(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
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
    setConnectionError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password, rememberMe);
        
        if (error) {
          if (error.message === "Failed to fetch" || error.message?.includes("network")) {
            setConnectionError("Connection error. Please check your internet and try again.");
            await handleReconnect();
          }
          throw error;
        }
      } else {
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

        const { error } = await signUp(email, password, {
          data: { 
            username,
            preferred_language: selectedLanguage
          }
        });
        
        if (error) {
          if (error.message === "Failed to fetch" || error.message?.includes("network")) {
            setConnectionError("Connection error. Please check your internet and try again.");
            await handleReconnect();
          }
          throw error;
        }
        
        // Change the app language immediately to the selected one
        await setLanguage(selectedLanguage);
        
        toast({
          title: "Success!",
          description: "Please check your email for verification instructions.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      if (error.message === "Invalid login credentials" || error.message?.includes("credentials")) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
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

  // Get language display name
  const getLanguageDisplay = (langCode: string) => {
    const lang = languages.find(l => l.id === langCode);
    return lang ? `${lang.flag_emoji} ${lang.name}` : langCode;
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
        
        {(!isOnline || connectionError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {!isOnline ? "You appear to be offline. Please check your connection." : connectionError}
              <Button 
                variant="outline"
                size="sm"
                onClick={handleReconnect} 
                disabled={reconnecting || !isOnline} 
                className="ml-2 mt-2"
              >
                {reconnecting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
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
            disabled={loading || !isOnline || reconnecting}
          >
            {loading ? t.processing : isLogin ? t.loginCta : t.signUpCta}
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
