import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/translations/auth';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();
  const t = authTranslations[currentLanguage as keyof typeof authTranslations] || authTranslations.en;
  
  useEffect(() => {
    if (session) {
      const returnUrl = new URLSearchParams(location.search).get('returnUrl');
      navigate(returnUrl || '/dashboard');
    }
  }, [session, navigate, location.search]);

  const checkUsernameAvailability = async (username: string) => {
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
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUsernameError('');

    try {
      if (isLogin) {
        const { error } = await signIn(email, password, rememberMe);
        if (error) throw error;
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
          data: { username }
        });
        
        if (error) throw error;
        
        toast({
          title: "Success!",
          description: "Please check your email for verification instructions.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
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
            disabled={loading}
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
