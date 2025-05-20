
import { supabase } from './client';

/**
 * Check if a username is available
 * @param username Username to check
 * @returns Promise<boolean> true if username is available, false otherwise
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error("Error checking username:", error);
      return true; // Assume available if check fails to avoid blocking signup
    }
    
    return data === null;
  } catch (error) {
    console.error("Error checking username availability:", error);
    return true; // Assume available if check fails
  }
};

/**
 * Check if user session is valid
 * @returns Promise<boolean> true if session is valid, false otherwise
 */
export const hasValidSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
    return !!data.session;
  } catch (error) {
    console.error('Exception checking session validity:', error);
    return false;
  }
};

/**
 * Refresh the user's session
 * @returns Promise<boolean> true if refresh was successful, false otherwise
 */
export const refreshSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
    return !!data.session;
  } catch (error) {
    console.error('Exception refreshing session:', error);
    return false;
  }
};

/**
 * Sign out the current user
 * @returns Promise<boolean> true if sign out was successful, false otherwise
 */
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Exception signing out:', error);
    return false;
  }
};
