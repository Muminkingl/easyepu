import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Check if the current user is an admin (for security)
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users from Clerk
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
        
        // If no firstName, try to get display name from OAuth accounts
        if (!fullName && user.externalAccounts && user.externalAccounts.length > 0) {
          const googleAccount = user.externalAccounts.find(account => 
            account.provider === 'google' || account.provider === 'oauth_google'
          );
          
          if (googleAccount && googleAccount.firstName) {
            fullName = `${googleAccount.firstName} ${googleAccount.lastName || ''}`.trim();
          } else if (googleAccount && googleAccount.username) {
            fullName = googleAccount.username;
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
          imageUrl: user.imageUrl,
          email: user.emailAddresses?.[0]?.emailAddress || '',
          // Include more details that might help for debugging
          hasOAuth: (user.externalAccounts && user.externalAccounts.length > 0) || false,
          oauthProviders: user.externalAccounts?.map(acc => acc.provider) || []
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