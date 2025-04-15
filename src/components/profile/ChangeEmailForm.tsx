
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ChangeEmailForm = ({ currentEmail }: { currentEmail: string }) => {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newEmail === currentEmail) {
      toast({
        title: "Error",
        description: "New email must be different from current email",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // First verify the user's password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password,
      });

      if (signInError) throw signInError;

      // If password is correct, update the email
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Please check your new email for a confirmation link",
      });

      // Clear form
      setNewEmail("");
      setPassword("");
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
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
          New Email
        </label>
        <Input
          id="newEmail"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter new email"
          className="max-w-md border-gray-300 text-[#545454]"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-[#545454]">
          Confirm Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="max-w-md border-gray-300 text-[#545454]"
        />
      </div>

      <Button 
        type="submit"
        disabled={loading}
        className="bg-[#33fea6] hover:bg-[#33fea6]/90 text-black"
      >
        {loading ? "Updating..." : "Change Email"}
      </Button>
    </form>
  );
};
