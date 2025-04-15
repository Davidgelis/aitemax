
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      {/* Left side - Logo and navigation */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/432df757-3f0d-4fe4-99f4-ca27f2322a86.png" 
            alt="Aitema X Logo" 
            className="h-8 w-8"
          />
          <span className="text-[#041524] font-semibold text-xl">Aitema X</span>
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

      {/* Right side - Auth button */}
      <div>
        {user ? (
          <span className="text-[#041524]">{user.email}</span>
        ) : (
          <Link to="/auth">
            <Button variant="outline" className="border-[#041524] text-[#041524]">
              Login / Sign up
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
