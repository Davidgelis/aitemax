
import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface PasswordProtectedRouteProps {
  children: React.ReactNode;
}

const PasswordProtectedRoute: React.FC<PasswordProtectedRouteProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const location = useLocation();
  const { toast } = useToast();

  // List of excluded paths that don't require password protection
  const excludedPaths = ['/auth', '/auth/'];
  
  // Check if the current path is excluded from password protection
  const isExcludedPath = excludedPaths.includes(location.pathname);
  
  // Check if user is already authenticated
  useEffect(() => {
    const hasAccess = localStorage.getItem("app_access") === "granted";
    if (hasAccess || isExcludedPath) {
      setIsAuthenticated(true);
      setIsOpen(false);
    }
  }, [isExcludedPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === "Aitema@2025") {
      setIsAuthenticated(true);
      setIsOpen(false);
      localStorage.setItem("app_access", "granted");
      
      toast({
        title: "Access granted",
        description: "Welcome to AitemaX",
      });
    } else {
      setAttempts(prev => prev + 1);
      
      toast({
        title: "Incorrect password",
        description: `Try again (Attempt ${attempts + 1})`,
        variant: "destructive",
      });

      // Clear the input
      setPassword("");
    }
  };

  if (isAuthenticated || isExcludedPath) {
    return <>{children}</>;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" /> 
              Password Protected
            </DialogTitle>
            <DialogDescription>
              This site is password protected. Enter the password to gain access.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              autoFocus
            />
            
            <DialogFooter>
              <Button type="submit" className="w-full">
                Unlock Access
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <div className="hidden"> {/* Hide content but render it to avoid layout shifts */}
        {children}
      </div>
    </>
  );
};

export default PasswordProtectedRoute;
