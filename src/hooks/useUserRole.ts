import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { getUserRole, getUserRoleByEmail, UserRole } from '@/lib/supabase';

export function useUserRole() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    async function checkUserRole() {
      if (!isLoaded || !isSignedIn || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const email = user.primaryEmailAddress?.emailAddress;
        
        // Try to get role by Clerk ID
        let role = await getUserRole(user.id);
        
        // If not admin or owner, try by email as fallback (in case the clerk_id doesn't match)
        if (role !== 'admin' && role !== 'owner' && email) {
          const emailRole = await getUserRoleByEmail(email);
          if (emailRole === 'admin' || emailRole === 'owner') {
            role = emailRole;
          }
        }
        
        // Create debug info for troubleshooting
        const debug = {
          userId: user.id,
          email: email,
          roleByClerkId: await getUserRole(user.id),
          roleByEmail: email ? await getUserRoleByEmail(email) : 'not checked',
          finalRole: role,
          timestamp: new Date().toISOString()
        };
        
        setDebugInfo(debug);
        
        setIsAdmin(role === 'admin' || role === 'owner');
        setIsOwner(role === 'owner');
      } catch (err) {
        console.error('Error in useUserRole:', err);
        setError(err instanceof Error ? err : new Error('Unknown error in useUserRole'));
      } finally {
        setIsLoading(false);
      }
    }

    checkUserRole();
  }, [isLoaded, isSignedIn, user]);

  // Force refresh function to manually re-check the role
  const refreshRole = async () => {
    setIsLoading(true);
    setError(null);
    
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      const email = user.primaryEmailAddress?.emailAddress;
      
      // Try to get role by Clerk ID
      let role = await getUserRole(user.id);
      
      // If not admin or owner, try by email as fallback
      if (role !== 'admin' && role !== 'owner' && email) {
        const emailRole = await getUserRoleByEmail(email);
        if (emailRole === 'admin' || emailRole === 'owner') {
          role = emailRole;
        }
      }
      
      setIsAdmin(role === 'admin' || role === 'owner');
      setIsOwner(role === 'owner');
    } catch (err) {
      console.error('Error refreshing user role:', err);
      setError(err instanceof Error ? err : new Error('Unknown error refreshing role'));
    } finally {
      setIsLoading(false);
    }
  };

  return { isAdmin, isOwner, isLoading, error, debugInfo, refreshRole };
} 