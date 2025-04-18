import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { UserRound, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarByValue } from "@/config/avatarConfig";
import { LanguageSelector } from '@/components/LanguageSelector';
const Navbar = () => {
  const {
    user,
    signOut
  } = useAuth();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("avatar1");
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const {
          data: profile
        } = await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single();
        if (profile) {
          if (profile.username) {
            setUsername(profile.username);
          }
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
        }
      }
    };
    fetchUserProfile();
  }, [user]);
  const handleSignOut = async () => {
    await signOut();
  };
  return;
};
export default Navbar;