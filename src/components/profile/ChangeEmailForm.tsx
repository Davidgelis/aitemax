
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from '@/context/LanguageContext';
import { profileTranslations } from '@/translations/profile';

export const ChangeEmailForm = ({ currentEmail }: { currentEmail: string }) => {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();
  const t = profileTranslations[currentLanguage as keyof typeof profileTranslations] || profileTranslations.en;

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !password) {
      toast({
        title: "Error",
        description: t.errors.requiredFields,
        variant: "destructive",
      });
      return;
    }

    if (newEmail === currentEmail) {
      toast({
        title: "Error",
        description: t.errors.sameEmail,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password,
      });

      if (signInError) throw signInError;

      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: t.success.emailUpdate,
      });

      setNewEmail("");
      setPassword("");
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || t.errors.emailUpdate,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailChange} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="newEmail" className="text-sm font-medium text-[#545454]">
          {t.newEmail}
        </label>
        <Input
          id="newEmail"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder={t.enterNewEmail}
          className="max-w-md border-gray-300 text-[#545454]"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-[#545454]">
          {t.confirmPassword}
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.enterPassword}
          className="max-w-md border-gray-300 text-[#545454]"
        />
      </div>

      <Button 
        type="submit"
        disabled={loading}
        className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black"
      >
        {loading ? t.updatingEmail : t.updateEmail}
      </Button>
    </form>
  );
};
