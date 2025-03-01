
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, UserRound, Users, UsersRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const Profile = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarType, setAvatarType] = useState("user");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
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

      // Update profile in the database
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

  // Render the appropriate avatar based on the selected type
  const renderAvatar = (type) => {
    switch (type) {
      case "user":
        return <User className="h-full w-full p-2" />;
      case "userRound":
        return <UserRound className="h-full w-full p-2" />;
      case "users":
        return <Users className="h-full w-full p-2" />;
      case "usersRound":
        return <UsersRound className="h-full w-full p-2" />;
      default:
        return <User className="h-full w-full p-2" />;
    }
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
          Back to Dashboard
        </Button>

        <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-[#33fea6] bg-white flex items-center justify-center overflow-hidden">
              {renderAvatar(avatarType)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#545454]">{username || "User Profile"}</h1>
              <p className="text-[#545454]">{email}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4 text-[#545454]">Avatar Selection</h2>
              <RadioGroup 
                value={avatarType} 
                onValueChange={setAvatarType}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Label
                    htmlFor="avatar-user"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                      avatarType === "user" ? "border-[#33fea6]" : "border-gray-300"
                    }`}>
                      <User className="h-10 w-10 text-[#545454]" />
                    </div>
                    <RadioGroupItem 
                      value="user" 
                      id="avatar-user" 
                      className="sr-only"
                    />
                    <span className="text-sm text-[#545454]">User</span>
                  </Label>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <Label
                    htmlFor="avatar-userRound"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                      avatarType === "userRound" ? "border-[#33fea6]" : "border-gray-300"
                    }`}>
                      <UserRound className="h-10 w-10 text-[#545454]" />
                    </div>
                    <RadioGroupItem 
                      value="userRound" 
                      id="avatar-userRound" 
                      className="sr-only"
                    />
                    <span className="text-sm text-[#545454]">User Round</span>
                  </Label>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <Label
                    htmlFor="avatar-users"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                      avatarType === "users" ? "border-[#33fea6]" : "border-gray-300"
                    }`}>
                      <Users className="h-10 w-10 text-[#545454]" />
                    </div>
                    <RadioGroupItem 
                      value="users" 
                      id="avatar-users" 
                      className="sr-only"
                    />
                    <span className="text-sm text-[#545454]">Users</span>
                  </Label>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <Label
                    htmlFor="avatar-usersRound"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                      avatarType === "usersRound" ? "border-[#33fea6]" : "border-gray-300"
                    }`}>
                      <UsersRound className="h-10 w-10 text-[#545454]" />
                    </div>
                    <RadioGroupItem 
                      value="usersRound" 
                      id="avatar-usersRound" 
                      className="sr-only"
                    />
                    <span className="text-sm text-[#545454]">Users Round</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator className="my-6" />

            <div>
              <h2 className="text-lg font-medium mb-4 text-[#545454]">Profile Information</h2>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-[#545454]">
                    Username
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
                    Email
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
              <h2 className="text-lg font-medium mb-4 text-[#545454]">Security</h2>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-gray-300 text-[#545454]"
                onClick={handleChangePassword}
              >
                <Lock className="h-4 w-4" />
                Change Password
              </Button>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleUpdateProfile}
                disabled={loading}
                className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black"
              >
                {loading ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
