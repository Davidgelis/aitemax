
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();

  // Translations
  const translations = {
    en: {
      title: "Reset Password",
      backToDashboard: "Back to Dashboard",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      passwordsMatch: "Passwords do not match",
      passwordLength: "Password must be at least 6 characters",
      resetPassword: "Reset Password",
      resetting: "Resetting...",
      success: "Password has been reset successfully",
      error: "Failed to reset password",
      redirectLogin: "Redirecting to login page..."
    },
    zh: {
      title: "重置密码",
      backToDashboard: "返回控制面板",
      newPassword: "新密码",
      confirmPassword: "确认密码",
      passwordsMatch: "密码不匹配",
      passwordLength: "密码长度必须至少为6个字符",
      resetPassword: "重置密码",
      resetting: "重置中...",
      success: "密码已成功重置",
      error: "重置密码失败",
      redirectLogin: "正在重定向到登录页面..."
    },
    es: {
      title: "Restablecer Contraseña",
      backToDashboard: "Volver al Panel",
      newPassword: "Nueva Contraseña",
      confirmPassword: "Confirmar Contraseña",
      passwordsMatch: "Las contraseñas no coinciden",
      passwordLength: "La contraseña debe tener al menos 6 caracteres",
      resetPassword: "Restablecer Contraseña",
      resetting: "Restableciendo...",
      success: "La contraseña se ha restablecido con éxito",
      error: "Error al restablecer la contraseña",
      redirectLogin: "Redirigiendo a la página de inicio de sesión..."
    },
    fr: {
      title: "Réinitialiser le Mot de Passe",
      backToDashboard: "Retour au Tableau de Bord",
      newPassword: "Nouveau Mot de Passe",
      confirmPassword: "Confirmer le Mot de Passe",
      passwordsMatch: "Les mots de passe ne correspondent pas",
      passwordLength: "Le mot de passe doit contenir au moins 6 caractères",
      resetPassword: "Réinitialiser le Mot de Passe",
      resetting: "Réinitialisation...",
      success: "Le mot de passe a été réinitialisé avec succès",
      error: "Échec de la réinitialisation du mot de passe",
      redirectLogin: "Redirection vers la page de connexion..."
    },
    de: {
      title: "Passwort Zurücksetzen",
      backToDashboard: "Zurück zum Dashboard",
      newPassword: "Neues Passwort",
      confirmPassword: "Passwort Bestätigen",
      passwordsMatch: "Passwörter stimmen nicht überein",
      passwordLength: "Das Passwort muss mindestens 6 Zeichen lang sein",
      resetPassword: "Passwort Zurücksetzen",
      resetting: "Wird zurückgesetzt...",
      success: "Das Passwort wurde erfolgreich zurückgesetzt",
      error: "Fehler beim Zurücksetzen des Passworts",
      redirectLogin: "Weiterleitung zur Anmeldeseite..."
    }
  };

  const t = translations[currentLanguage as keyof typeof translations] || translations.en;

  useEffect(() => {
    // This page should only be accessible via the reset password link
    const checkResetToken = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      
      if (!accessToken) {
        navigate("/auth");
      }
    };

    checkResetToken();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: t.passwordsMatch,
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: t.passwordLength,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast({
        title: "Success",
        description: t.success,
      });

      // Redirect to login after successful password reset
      setTimeout(() => {
        toast({
          description: t.redirectLogin,
        });
        navigate("/auth");
      }, 2000);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: t.error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-[#545454]"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.backToDashboard}
        </Button>

        <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-[#545454] mb-6">{t.title}</h1>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#545454]">
                {t.newPassword}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gray-300 text-[#545454]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-[#545454]">
                {t.confirmPassword}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-gray-300 text-[#545454]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#33fea6] hover:bg-[#33fea6]/90 text-black"
            >
              {loading ? t.resetting : t.resetPassword}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
