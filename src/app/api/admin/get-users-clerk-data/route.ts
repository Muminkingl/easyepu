import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Check if the current user is authenticated
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user is an admin by querying Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();
    
    if (userError || userData?.role !== 'admin') {
      console.error('User is not an admin:', userId);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all users from Clerk - now that we confirmed the user is an admin
    try {
      const users = await clerkClient.users.getUserList({
        limit: 500, // Increase limit to ensure we get all users
      });
      
      // Format the response with only the data we need
      const userData = users.map(user => {
        // First try to get name from firstName/lastName
        let fullName = '';
        if (user.firstName) {
          fullName = `${user.firstName} ${user.lastName || ''}`.trim();
        }
        
        // Set default imageUrl
        let imageUrl = user.imageUrl;
        let provider = '';
        
        // Check if user has OAuth accounts
        if (user.externalAccounts && user.externalAccounts.length > 0) {
          // Look for Google account first (higher priority)
          const googleAccount = user.externalAccounts.find(account => 
            account.provider === 'google' || account.provider === 'oauth_google'
          );
          
          // Get name from Google account if available
          if (googleAccount) {
            // Try to get full name from Google account
            if (googleAccount.firstName) {
              fullName = `${googleAccount.firstName} ${googleAccount.lastName || ''}`.trim();
            } else if (googleAccount.username) {
              fullName = googleAccount.username;
            }
            
            // Try to get Google profile image - higher priority than Clerk default
            if (googleAccount.avatarUrl) {
              imageUrl = googleAccount.avatarUrl;
              provider = 'google';
            }
          }
          
          // If no Google account, check for other providers
          if (!provider && user.externalAccounts.length > 0) {
            const firstAccount = user.externalAccounts[0];
            if (firstAccount.avatarUrl) {
              imageUrl = firstAccount.avatarUrl;
              provider = firstAccount.provider;
            }
          }
        }
        
        // If still no name, try username
        if (!fullName && user.username) {
          fullName = user.username;
        }
        
        // Finally, fall back to email prefix
        if (!fullName && user.emailAddresses && user.emailAddresses.length > 0) {
          const emailPrefix = user.emailAddresses[0].emailAddress.split('@')[0];
          fullName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        }

        return {
          id: user.id,
          fullName: fullName,
          imageUrl: imageUrl,
          email: user.emailAddresses?.[0]?.emailAddress || '',
          // Include information about OAuth accounts
          hasOAuth: (user.externalAccounts && user.externalAccounts.length > 0) || false,
          oauthProvider: provider,
          oauthProviders: user.externalAccounts?.map(acc => acc.provider) || [],
          // For debugging - include all avatars to help troubleshoot
          oauthAvatars: user.externalAccounts?.map(acc => ({
            provider: acc.provider,
            avatarUrl: acc.avatarUrl
          })) || []
        };
      });
      
      return NextResponse.json({ users: userData });
    } catch (error) {
      console.error('Error fetching users from Clerk:', error);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in get-users-clerk-data API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 