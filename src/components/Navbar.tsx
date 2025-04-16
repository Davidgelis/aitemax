import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { UserRound, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarByValue } from "@/config/avatarConfig";

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
  
  return <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/0">
    {/* Left side - Logo and navigation */}
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-4">
        <img alt="Aitema X Logo" src="/lovable-uploads/504bee69-5086-451b-b981-747da6c72bc9.png" className="h-[50px] w-auto" />
      </div>
      
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-[#041524] hover:text-[#33fea6] transition-colors">
          Dashboard
        </Link>
        <Link to="/x-panel" className="text-[#041524] hover:text-[#33fea6] transition-colors">
          X Panel
        </Link>
        <span className="text-[#041524] cursor-not-allowed opacity-70">
          Support
        </span>
      </div>
    </div>

    <div>
      {user ? <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 text-[#041524] hover:text-[#33fea6]">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-white flex items-center justify-center">
              <img 
                src={getAvatarByValue(avatarUrl).src} 
                alt="User Avatar"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <span>{username || "User"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer">
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> : <Link to="/auth">
        <Button variant="outline" className="border-[#041524] text-[#041524]">
          Login / Sign up
        </Button>
      </Link>}
    </div>
  </nav>;
};

export default Navbar;
