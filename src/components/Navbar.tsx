
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, LayoutPanelTop, HelpCircle } from "lucide-react";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/8115ae35-0c47-43f7-8fe0-e787090c5650.png" 
              alt="Aitema Logo" 
              className="h-8 w-8 mr-2" 
            />
            <span className="text-xl font-bold text-[#041524]">AITEMA</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-2 text-gray-700 hover:text-[#33fea6] transition-colors"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/x-panel" 
              className="flex items-center space-x-2 text-gray-700 hover:text-[#33fea6] transition-colors"
            >
              <LayoutPanelTop size={18} />
              <span>Panel</span>
            </Link>
            <Link 
              to="/support" 
              className="flex items-center space-x-2 text-gray-700 hover:text-[#33fea6] transition-colors"
            >
              <HelpCircle size={18} />
              <span>Support</span>
            </Link>
          </div>

          {/* Login/Signup Button */}
          <Button asChild variant="aurora">
            <Link to={user ? "/dashboard" : "/auth"}>
              {user ? "Dashboard" : "Login / Sign up"}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
