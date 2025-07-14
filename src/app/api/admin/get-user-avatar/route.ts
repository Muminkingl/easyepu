import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    // Get the query parameters from the request
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the user data from Clerk
    try {
      const user = await clerkClient.users.getUser(userId);
      
      // Return the user's image URL if available
      return NextResponse.json({
        imageUrl: user.imageUrl,
        hasImage: !!user.imageUrl
      });
    } catch (error) {
      console.error('Error fetching user from Clerk:', error);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in get-user-avatar API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 