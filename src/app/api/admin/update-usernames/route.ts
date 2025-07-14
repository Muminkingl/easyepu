import { NextResponse } from 'next/server';
import { getAllUsers, updateUsername } from '@/lib/supabase';
import { getAuth } from '@clerk/nextjs/server';

export async function POST() {
  try {
    // Get all users from Supabase
    const users = await getAllUsers();
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found' }, { status: 200 });
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process ALL users
    for (const user of users) {
      try {
        // Skip users that already have proper names (not matching email format)
        if (user.username && 
            !user.username.includes("Unnamed User") && 
            !user.username.startsWith(user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1))) {
          skippedCount++;
          continue;
        }
        
        try {
          // For the API endpoint, we'll use a simpler approach since Clerk client is giving errors
          // Just use the email username part but capitalized 
          const emailName = user.email.split('@')[0];
          const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          
          const success = await updateUsername(user.clerk_id, displayName);
          if (success) {
            updatedCount++;
          } else {
            errorCount++;
          }
        } catch (apiError) {
          console.error(`Error updating user ${user.clerk_id}:`, apiError);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error updating user ${user.clerk_id}:`, error);
        errorCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} users, skipped ${skippedCount}, ${errorCount} errors`,
      updatedCount,
      skippedCount,
      errorCount
    });
  } catch (error) {
    console.error('Error in update-usernames API route:', error);
    return NextResponse.json(
      { error: 'Failed to update usernames' },
      { status: 500 }
    );
  }
}