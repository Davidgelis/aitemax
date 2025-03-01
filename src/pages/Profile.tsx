
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    async function getProfile() {
      try {
        setLoading(true);
        
        // Get user email from auth
        setEmail(user.email || '');
        
        // Set default username from email if not set
        const defaultUsername = user.email ? user.email.split('@')[0] : '';
        setUsername(defaultUsername);
        
        // Get profile data including avatar
        const { data, error } = await supabase
          .storage
          .from('avatars')
          .list(user.id, {
            limit: 1,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          const { data: url } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(`${user.id}/${data[0].name}`);
            
          setAvatarUrl(url.publicUrl);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error loading profile",
          description: "There was a problem loading your profile.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [user, navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image should be less than 2MB.",
          variant: "destructive"
        });
        return;
      }
      
      setAvatarFile(file);
      // Create a preview
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Upload avatar if a new one was selected
      if (avatarFile) {
        // Delete old avatars first
        const { data: oldAvatars } = await supabase
          .storage
          .from('avatars')
          .list(user.id);
          
        if (oldAvatars && oldAvatars.length > 0) {
          const filesToRemove = oldAvatars.map(file => `${user.id}/${file.name}`);
          await supabase
            .storage
            .from('avatars')
            .remove(filesToRemove);
        }
        
        // Upload new avatar
        const fileName = `${Date.now()}_${avatarFile.name}`;
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(`${user.id}/${fileName}`, avatarFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL
        const { data: url } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(`${user.id}/${fileName}`);
          
        setAvatarUrl(url.publicUrl);
      }
      
      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ 
          email: email 
        });
        
        if (emailError) {
          throw emailError;
        }
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: error.message || "There was a problem updating your profile.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth'
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link."
      });
      
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error resetting password",
        description: error.message || "There was a problem sending the password reset email.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Manage your account settings and profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback>{username ? username[0].toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <Label htmlFor="avatar-upload" className="cursor-pointer bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground px-4 py-2 rounded-md">
              Change Profile Picture
              <Input 
                id="avatar-upload"
                type="file" 
                onChange={handleAvatarChange} 
                className="hidden"
                accept="image/*"
              />
            </Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              disabled
              placeholder="Username"
              className="w-full"
            />
            <p className="text-xs text-gray-500">Username is derived from your email and cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full"
            />
          </div>
          
          <Button
            onClick={resetPassword}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            Reset Password
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={updateProfile}
            disabled={loading}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;
