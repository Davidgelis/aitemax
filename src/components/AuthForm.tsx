
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
import { Globe, AlertTriangle, Loader, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { checkUsernameAvailability } from '@/integrations/supabase/auth-helpers';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [usernameError, setUsernameError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage, languages, setLanguage } = useLanguage();
  const t = authTranslations[currentLanguage as keyof typeof authTranslations] || authTranslations.en;
  
  const { 
    session,
    loading: authLoading,
    signIn,
    signUp,
    isOnline
  } = useAuth();
  
  // Set default language
  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);
  
  // Redirect if authenticated
  useEffect(() => {
    if (session) {
      console.log('User is authenticated, redirecting...');
      const returnUrl = new URLSearchParams(location.search).get('returnUrl');
      navigate(returnUrl || '/dashboard');
    }
  }, [session, navigate, location.search]);
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setFormError(null);
    setUsernameError('');
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setFormError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }
    
    if (!isOnline) {
      setFormError('You appear to be offline. Please check your connection.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (isLogin) {
        console.log('Attempting login...');
        const { error } = await signIn(email, password, rememberMe);
        
        if (error) {
          console.error("Login failed:", error);
          setFormError(error.message || 'Login failed. Please try again.');
        } else {
          console.log('Login successful');
        }
      } else {
        // Registration flow
        if (!username.trim()) {
          setUsernameError('Username is required');
          setIsSubmitting(false);
          return;
        }
        
        console.log('Checking username availability...');
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          setUsernameError('This username is already taken');
          setIsSubmitting(false);
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
          setFormError(error.message || 'Signup failed. Please try again.');
        } else {
          console.log('Signup successful');
          await setLanguage(selectedLanguage);
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error('Unexpected error during authentication:', error);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isFormDisabled = authLoading || isSubmitting;
  
  return (
    <form onSubmit={handleAuth} className="space-y-4">
      {/* Error display */}
      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      
      {/* Connection status - non-blocking */}
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
          disabled={isFormDisabled}
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
              disabled={isFormDisabled}
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
              disabled={isFormDisabled}
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
          disabled={isFormDisabled}
        />
      </div>
      
      {isLogin && (
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="rememberMe" 
            checked={rememberMe} 
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={isFormDisabled}
          />
          <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
            {t.keepSignedIn}
          </Label>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full aurora-button" 
        disabled={isFormDisabled}
      >
        {isSubmitting ? (
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
            setFormError(null);
          }}
          className="text-sm text-[#545454] hover:underline"
          disabled={isFormDisabled}
        >
          {isLogin ? t.switchToSignUp : t.switchToLogin}
        </button>
      </div>
    </form>
  );
};

export default AuthForm;
