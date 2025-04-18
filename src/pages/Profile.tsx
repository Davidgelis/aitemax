import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Workflow, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import MasterPanel from "@/components/dashboard/MasterPanel";
import { ChangeEmailForm } from "@/components/profile/ChangeEmailForm";
import { avatarOptions } from "@/config/avatarConfig";
import { useLanguage } from '@/context/LanguageContext';
import { profileTranslations } from '@/translations/profile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Profile = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarType, setAvatarType] = useState("avatar1");
  const [loading, setLoading] = useState(false);
  const [showMasterPanel, setShowMasterPanel] = useState(false);
  const [isMasterUser, setIsMasterUser] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { languages, currentLanguage, setLanguage } = useLanguage();
  const t = profileTranslations[currentLanguage as keyof typeof profileTranslations] || profileTranslations.en;

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        // Check if the user is the master user
        if (user.id === '8b40d73f-fffb-411f-9044-480773968d58') {
          setIsMasterUser(true);
        }

        setEmail(user.email || "");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setUsername(profileData.username || "");
          if (profileData.avatar_url) {
            setAvatarType(profileData.avatar_url);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        });
      }
    };

    getProfile();
  }, [navigate, toast]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ 
          username, 
          avatar_url: avatarType 
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions",
      });
    } catch (error) {
      console.error("Error sending reset password email:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    }
  };

  const getSelectedAvatarSrc = () => {
    const selectedAvatar = avatarOptions.find(avatar => avatar.value === avatarType);
    return selectedAvatar?.src || avatarOptions[0].src;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-[#545454]"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>

        <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-[#33fea6] bg-white flex items-center justify-center overflow-hidden">
              <img 
                src={getSelectedAvatarSrc()} 
                alt="Selected Avatar" 
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#545454]">{username || t.profile}</h1>
              <p className="text-[#545454]">{email}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4 text-[#545454]">{t.avatarSelection}</h2>
              <RadioGroup 
                value={avatarType} 
                onValueChange={setAvatarType}
                className="grid grid-cols-2 md:grid-cols-5 gap-4"
              >
                {avatarOptions.map((avatar) => (
                  <div key={avatar.id} className="flex flex-col items-center">
                    <Label
                      htmlFor={avatar.id}
                      className="cursor-pointer flex items-center justify-center"
                    >
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                        avatarType === avatar.value ? "border-[#33fea6]" : "border-gray-300"
                      } p-1 bg-white`}>
                        <img 
                          src={avatar.src} 
                          alt={avatar.alt} 
                          className="h-12 w-12 object-contain"
                        />
                      </div>
                      <RadioGroupItem 
                        value={avatar.value} 
                        id={avatar.id} 
                        className="sr-only"
                      />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator className="my-6" />

            <div>
              <h2 className="text-lg font-medium mb-4 text-[#545454]">{t.profileInfo}</h2>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-[#545454]">
                    {t.username}
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="max-w-md border-gray-300 text-[#545454]"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-[#545454]">
                    {t.email}
                  </label>
                  <Input
                    id="email"
                    value={email}
                    readOnly
                    className="max-w-md bg-gray-100 border-gray-300 text-[#545454]"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-medium mb-4 text-[#545454]">{t.security}</h2>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-gray-300 text-[#545454]"
                onClick={handleChangePassword}
              >
                <Lock className="h-4 w-4" />
                {t.changePassword}
              </Button>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-medium mb-4 text-[#545454]">{t.changeEmail}</h2>
              <ChangeEmailForm currentEmail={email} />
            </div>

            {isMasterUser && (
              <>
                <Separator />
                <div>
                  <h2 className="text-lg font-medium mb-4 text-[#545454]">{t.administrator}</h2>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 border-gray-300 text-[#545454]"
                    onClick={() => setShowMasterPanel(!showMasterPanel)}
                  >
                    <Workflow className="h-4 w-4" />
                    {showMasterPanel ? t.hidePanel : t.showPanel}
                  </Button>
                </div>
              </>
            )}

            <div className="pt-4">
              <Button 
                onClick={handleUpdateProfile}
                disabled={loading}
                className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black"
              >
                {loading ? t.saving : t.saveChanges}
              </Button>
            </div>
          </div>
        </div>

        {isMasterUser && showMasterPanel && (
          <div className="mt-6">
            <MasterPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
