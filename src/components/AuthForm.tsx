
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
import { useAuth } from '@/context/AuthContext';
import { checkUsernameAvailability } from '@/integrations/supabase/auth-helpers';

/**
 * Streamlined AuthForm with non-blocking connection management
 */
const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [usernameError, setUsernameError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [lastSubmitAttempt, setLastSubmitAttempt] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage, languages, setLanguage } = useLanguage();
  const t = authTranslations[currentLanguage as keyof typeof authTranslations] || authTranslations.en;
  
  // Use consolidated auth context
  const { 
    session,
    loading,
    authError,
    signIn,
    signUp,
    setAuthError,
    isOnline
  } = useAuth();
  
  // Set the default selected language to match the current app language
  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);
  
  // Automatically redirect if session exists
  useEffect(() => {
    if (session) {
      console.log('User is authenticated, redirecting...');
      const returnUrl = new URLSearchParams(location.search).get('returnUrl');
      navigate(returnUrl || '/dashboard');
    }
  }, [session, navigate, location.search]);
  
  // Simplified form submission without blocking connection checks
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent rapid repeated submissions
    const now = Date.now();
    if (now - lastSubmitAttempt < 2000) {
      console.log("Throttling submission attempts");
      return;
    }
    setLastSubmitAttempt(now);
    
    // Clear previous errors
    setAuthError(null);
    setUsernameError('');
    
    // Validate form inputs
    if (!email.trim() || !password.trim()) {
      setAuthError('Please fill in all required fields');
      return;
    }
    
    try {
      if (isLogin) {
        // Login flow
        console.log('Attempting login...');
        const { error } = await signIn(email, password, rememberMe);
        
        if (error) {
          console.error("Login failed:", error);
        } else {
          console.log('Login successful');
        }
      } else {
        // Registration flow with validation
        if (!username.trim()) {
          setUsernameError('Username is required');
          return;
        }
        
        console.log('Checking username availability...');
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setUsernameError('This username is already taken');
          return;
        }
        
        console.log('Attempting signup...');
        const { error } = await signUp(email, password, {
          data: { 
            username: username.trim(),
            preferred_language: selectedLanguage
          }
        });
        
        if (error) {
          console.error("Signup failed:", error);
        } else {
          console.log('Signup successful');
          await setLanguage(selectedLanguage);
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error('Unexpected error during authentication:', error);
      setAuthError('An unexpected error occurred. Please try again.');
    }
  };
  
  // Only show critical connection issues
  const showConnectionWarning = !isOnline;
  
  return (
    <form onSubmit={handleAuth} className="space-y-4">
      {/* Only show alert for critical errors or offline status */}
      {(authError || showConnectionWarning) && (
        <Alert variant={authError ? "destructive" : "default"} className="mb-4">
          <div className="flex items-start gap-2">
            {showConnectionWarning ? (
              <WifiOff className="h-4 w-4 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 mt-0.5" />
            )}
            <AlertDescription>
              {authError || "You're offline. Login may not work properly."}
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      {/* Simplified connection status - non-blocking */}
      <div className="flex items-center justify-end mb-2">
        <span className="text-xs text-gray-500 flex items-center">
          {isOnline ? (
            <><Wifi className="w-3 h-3 text-green-500 mr-1" /> Online</>
          ) : (
            <><WifiOff className="w-3 h-3 text-red-500 mr-1" /> Offline</>
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
          disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
          disabled={loading}
        />
      </div>
      
      {isLogin && (
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="rememberMe" 
            checked={rememberMe} 
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={loading}
          />
          <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
            {t.keepSignedIn}
          </Label>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full aurora-button" 
        disabled={loading}
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
      
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setUsernameError('');
            setUsername('');
            setAuthError(null);
          }}
          className="text-sm text-[#545454] hover:underline"
          disabled={loading}
        >
          {isLogin ? t.switchToSignUp : t.switchToLogin}
        </button>
      </div>
    </form>
  );
};

export default AuthForm;
