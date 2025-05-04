import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { getUserData, upsertUser, updateUsername, updatePhoneNumber, updateGender, updateGroupClass, UserData, UserRole } from '@/lib/supabase';

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
        
        // Only upsert with the role if it already exists
        await upsertUser({
          clerk_id: user.id,
          email: email,
          role: existingData?.role // Preserve existing role if it exists
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

  const updateUserUsername = async (username: string): Promise<boolean> => {
    if (!userData || !user) return false;
    
    try {
      const success = await updateUsername(user.id, username);
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

  const updateUserGroupClass = async (groupClass: string): Promise<boolean> => {
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

  return { 
    userData, 
    isLoading, 
    error, 
    isAdmin: userData?.role === 'admin',
    updateUsername: updateUserUsername,
    updatePhoneNumber: updateUserPhoneNumber,
    updateGender: updateUserGender,
    updateGroupClass: updateUserGroupClass
  };
} 