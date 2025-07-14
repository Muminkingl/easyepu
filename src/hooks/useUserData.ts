import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { getUserData, upsertUser, updateUsername as updateUsernameInDB, updatePhoneNumber, updateGender, updateGroupClass, updateSemester, UserData, UserRole } from '@/lib/supabase';

export function useUserData() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!isLoaded || !isSignedIn || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if environment variables are properly configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase environment variables are missing.');
          setUserData({
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            role: 'student'
          });
          setIsLoading(false);
          return;
        }

        // Get user email
        const email = user.primaryEmailAddress?.emailAddress;
        if (!email) {
          console.warn('User email not available');
          setUserData({
            clerk_id: user.id,
            email: '',
            role: 'student'
          });
          setIsLoading(false);
          return;
        }

        // First, try to get existing user data to preserve role information
        const existingData = await getUserData(user.id);
        
        // Get the user's name prioritizing Google OAuth provider data
        let displayName = null;
        
        // IMPORTANT: Look for the OAuth accounts that have the user's Google profile name
        const googleAuth = user.externalAccounts?.find((account: any) => 
          account.provider === 'google' || account.provider === 'oauth_google'
        );
        
        if (googleAuth) {
          // Direct access to the OAuth profile's display name from Google
          console.log("Found Google account:", googleAuth);
          
          if (googleAuth.firstName && googleAuth.lastName) {
            displayName = `${googleAuth.firstName} ${googleAuth.lastName}`;
            console.log("Found Google name:", displayName);
          } else if (googleAuth.username) {
            displayName = googleAuth.username;
            console.log("Found Google username:", displayName);
          } else if (googleAuth.emailAddress) {
            // Extract the display name from the email address if profile info not available
            const emailParts = googleAuth.emailAddress.split('@');
            if (emailParts.length > 0) {
              displayName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
              console.log("Extracted name from Google email:", displayName);
            }
          }
        }
        
        // If no name from Google OAuth, try standard name fields from Clerk
        if (!displayName) {
          if (user.fullName) {
            displayName = user.fullName;
          } else if (user.firstName && user.lastName) {
            displayName = `${user.firstName} ${user.lastName}`;
          } else if (user.firstName) {
            displayName = user.firstName;
          } 
          // If no name from Clerk, create a proper name from email
          else if (email) {
            const emailName = email.split('@')[0];
            // Convert formats like "ectc02m250005" to "Ectc02m250005"
            displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          }
        }
        
        console.log("Final selected display name:", displayName);
        
        // Don't overwrite existing username if it's already set
        const usernameToUse = existingData?.username || displayName;
        
        // ALWAYS use the best available name, prioritizing OAuth profile data
        await upsertUser({
          clerk_id: user.id,
          email: email,
          role: existingData?.role, // Preserve existing role if it exists
          username: usernameToUse
        });

        // Get updated user data
        const data = await getUserData(user.id);
        setUserData(data || {
          clerk_id: user.id,
          email: email,
          role: 'student'
        });
      } catch (err) {
        console.error('Error in useUserData:', err);
        setError(err instanceof Error ? err : new Error('Unknown error in useUserData'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [isLoaded, isSignedIn, user]);

  const updateUsername = async (username: string): Promise<boolean> => {
    if (!userData || !user) return false;
    
    try {
      const success = await updateUsernameInDB(user.id, username);
      if (success) {
        setUserData(prev => prev ? { ...prev, username } : null);
      }
      return success;
    } catch (err) {
      console.error('Error updating username:', err);
      return false;
    }
  };

  const updateUserPhoneNumber = async (phoneNumber: string): Promise<boolean> => {
    if (!userData || !user) return false;
    
    try {
      const success = await updatePhoneNumber(user.id, phoneNumber);
      if (success) {
        setUserData(prev => prev ? { ...prev, phone_number: phoneNumber } : null);
      }
      return success;
    } catch (err) {
      console.error('Error updating phone number:', err);
      return false;
    }
  };

  const updateUserGender = async (gender: string): Promise<boolean> => {
    if (!userData || !user) return false;
    
    try {
      const success = await updateGender(user.id, gender);
      if (success) {
        setUserData(prev => prev ? { ...prev, gender } : null);
      }
      return success;
    } catch (err) {
      console.error('Error updating gender:', err);
      return false;
    }
  };

  const updateUserGroup = async (groupClass: string): Promise<boolean> => {
    if (!userData || !user) return false;
    
    try {
      const success = await updateGroupClass(user.id, groupClass);
      if (success) {
        setUserData(prev => prev ? { ...prev, group_class: groupClass } : null);
      }
      return success;
    } catch (err) {
      console.error('Error updating group class:', err);
      return false;
    }
  };

  const updateUserSemester = async (semester: number): Promise<boolean> => {
    if (!userData || !user) return false;
    
    try {
      const success = await updateSemester(user.id, semester);
      if (success) {
        setUserData(prev => prev ? { ...prev, semester } : null);
      }
      return success;
    } catch (err) {
      console.error('Error updating semester:', err);
      return false;
    }
  };

  const isAdmin = userData?.role === 'admin';

  return { 
    userData, 
    isAdmin,
    isLoading, 
    error, 
    updateUsername,
    updateUserPhoneNumber,
    updateUserGender,
    updateUserGroup,
    updateUserSemester
  };
}