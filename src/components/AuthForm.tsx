
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/translations/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, RefreshCw, Wifi, WifiOff, AlertTriangle, Loader } from 'lucide-react';
import { useConnectionManager } from '@/hooks/useConnectionManager';
import { useAuthState } from '@/hooks/useAuthState';
import { checkUsernameAvailability } from '@/integrations/supabase/auth-helpers';

/**
 * AuthForm component handles user authentication including login and signup
 */
const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [usernameError, setUsernameError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [lastLoginAttempt, setLastLoginAttempt] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage, languages, setLanguage } = useLanguage();
  const t = authTranslations[currentLanguage as keyof typeof authTranslations] || authTranslations.en;
  
  // Use our unified hooks
  const { 
    status: connectionStatus, 
    isOnline, 
    isOffline, 
    isDegraded,
    isChecking: reconnecting, 
    connectionDetails,
    checkConnection: handleReconnect,
    browserCompatible
  } = useConnectionManager();
  
  const {
    user,
    session,
    loading,
    authError,
    loginInProgress,
    login,
    signup,
    setAuthError
  } = useAuthState();
  
  // Set the default selected language to match the current app language
  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);
  
  // Automatically redirect if session exists
  useEffect(() => {
    if (session) {
      const returnUrl = new URLSearchParams(location.search).get('returnUrl');
      navigate(returnUrl || '/dashboard');
    }
  }, [session, navigate, location.search]);
  
  // Reset auth state
  const resetAuthState = () => {
    setAuthError(null);
  };
  
  // Handle form submission for both login and signup
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent rapid repeated login attempts
    const now = Date.now();
    if (now - lastLoginAttempt < 2000) {
      console.log("Throttling login attempts");
      return;
    }
    setLastLoginAttempt(now);
    
    // Reset error states
    resetAuthState();
    
    // Prevent authentication if offline
    if (isOffline) {
      setAuthError("You're offline. Please check your internet connection before logging in.");
      return;
    }
    
    if (isLogin) {
      // Login flow
      const { error } = await login(email, password, rememberMe);
      
      if (error) {
        console.error("Login error:", error);
        // Error handling is managed inside the login function
      }
    } else {
      // Registration flow with validation
      if (!username) {
        setUsernameError(t.errors.usernameRequired);
        return;
      }
      
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setUsernameError(t.errors.usernameTaken);
        return;
      }
      
      // Use signup from auth state
      const { error } = await signup(email, password, {
        data: { 
          username,
          preferred_language: selectedLanguage
        }
      });
      
      if (!error) {
        // Change the app language immediately to the selected one
        await setLanguage(selectedLanguage);
        setIsLogin(true);
      }
    }
  };
  
  // Status message based on connection state
  const getConnectionMessage = () => {
    if (isOffline) return "You're offline. Please check your internet connection.";
    if (isDegraded) return "Connection issues detected. Some features may not work correctly.";
    if (!browserCompatible) return "Your browser may not support all features needed for authentication.";
    return connectionDetails || null;
  };
  
  const connectionMessage = getConnectionMessage();
  
  return (
    <form onSubmit={handleAuth} className="space-y-4">
      {/* Connection status alerts with improved actions */}
      {(connectionMessage || authError) && (
        <Alert 
          variant={isOffline ? "destructive" : isDegraded ? "warning" : authError ? "destructive" : "default"} 
          className="mb-4"
        >
          <div className="flex items-start gap-2">
            {isOffline ? (
              <WifiOff className="h-4 w-4 mt-0.5" />
            ) : isDegraded ? (
              <AlertTriangle className="h-4 w-4 mt-0.5" />
            ) : authError ? (
              <AlertTriangle className="h-4 w-4 mt-0.5" />
            ) : (
              <Wifi className="h-4 w-4 mt-0.5" />
            )}
            <AlertDescription className="flex flex-col gap-2">
              {authError || connectionMessage}
              
              {(isOffline || isDegraded) && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleReconnect} 
                  disabled={reconnecting} 
                  className="self-start mt-2"
                >
                  {reconnecting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  {reconnecting ? "Checking..." : "Test Connection"}
                </Button>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      {/* Connection indicator with clearer status */}
      <div className="flex items-center justify-end mb-4">
        <span className="text-sm flex items-center">
          {reconnecting ? (
            <><RefreshCw className="w-4 h-4 text-amber-500 animate-spin mr-1" /> Connecting...</>
          ) : isOnline ? (
            <><Wifi className="w-4 h-4 text-green-500 mr-1" /> Connected</>
          ) : isOffline ? (
            <><WifiOff className="w-4 h-4 text-red-500 mr-1" /> Offline</>
          ) : (
            <><AlertTriangle className="w-4 h-4 text-amber-500 mr-1" /> Connection issues</>
          )}
        </span>
      </div>
      
      <div>
        <Input
          type="email"
          placeholder={t.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
          disabled={loading || loginInProgress}
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
              disabled={loading || loginInProgress}
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
              disabled={loading || loginInProgress}
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
          disabled={loading || loginInProgress}
        />
      </div>
      
      {isLogin && (
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="rememberMe" 
            checked={rememberMe} 
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={loading || loginInProgress}
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
        disabled={loading || loginInProgress || isOffline || reconnecting}
      >
        {loginInProgress ? (
          <span className="flex items-center">
            <Loader className="animate-spin mr-2 h-4 w-4" />
            {t.processing}
          </span>
        ) : (
          isLogin ? t.loginCta : t.signUpCta
        )}
      </Button>
      
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setUsernameError('');
            setUsername('');
            resetAuthState();
          }}
          className="text-sm text-[#545454] hover:underline"
          disabled={loading || loginInProgress}
        >
          {isLogin ? t.switchToSignUp : t.switchToLogin}
        </button>
      </div>
    </form>
  );
};

export default AuthForm;
