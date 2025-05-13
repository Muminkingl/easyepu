import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory cache to store blob URLs temporarily (would use Redis in production)
const blobCache = new Map<string, { url: string, expiry: number, filename: string }>();

/**
 * Register a blob URL to be downloaded
 */
export async function POST(request: NextRequest) {
  try {
    // Get the blob URL from the request body
    const data = await request.json();
    const { blobUrl, filename } = data;
    
    if (!blobUrl || !blobUrl.startsWith('blob:')) {
      return NextResponse.json({ error: 'Invalid blob URL' }, { status: 400 });
    }
    
    // Generate a unique token to identify this blob
    const token = crypto.randomBytes(16).toString('hex');
    
    // Store the blob URL in our cache with a 5-minute expiry
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    blobCache.set(token, { 
      url: blobUrl, 
      expiry,
      filename: filename || 'download'
    });
    
    // Return the token that can be used to download the file
    return NextResponse.json({ 
      success: true, 
      downloadUrl: `/api/blob-download?token=${token}` 
    });
  } catch (error) {
    console.error('Error registering blob URL:', error);
    return NextResponse.json({ 
      error: 'Failed to process blob URL', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

/**
 * Get a previously registered blob URL
 */
export async function GET(request: NextRequest) {
  try {
    // Get the token from the query parameter
    const token = request.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }
    
    // Retrieve the blob URL from our cache
    const cacheEntry = blobCache.get(token);
    
    if (!cacheEntry) {
      return NextResponse.json({ error: 'Token not found or expired' }, { status: 404 });
    }
    
    // Check if the token has expired
    if (cacheEntry.expiry < Date.now()) {
      blobCache.delete(token);
      return NextResponse.json({ error: 'Token expired' }, { status: 410 });
    }
    
    // For security, delete the token after it's used
    blobCache.delete(token);
    
    // Redirect to the blob URL
    return NextResponse.redirect(cacheEntry.url);
  } catch (error) {
    console.error('Error retrieving blob URL:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve blob URL', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 