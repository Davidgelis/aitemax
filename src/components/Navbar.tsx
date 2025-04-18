
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

  return (
    <nav className="bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-[#041524]">PromptPro</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center">
                      <img 
                        src={getAvatarByValue(avatarUrl).src}
                        alt="User Avatar"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {username && (
                        <p className="font-medium">{username}</p>
                      )}
                      {user.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <UserRound className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
