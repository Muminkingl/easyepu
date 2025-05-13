import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for secure file downloads
 * This resolves blob URL and CORS issues by having the server fetch and stream the file
 */
export async function GET(request: NextRequest) {
  try {
    // Get the file URL from the query params
    const url = request.nextUrl.searchParams.get('url');
    const fileName = request.nextUrl.searchParams.get('fileName') || 'download';
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }
    
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(url);
    
    // Fetch the file
    const response = await fetch(decodedUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the file content as an array buffer
    const fileBuffer = await response.arrayBuffer();
    
    // Create a new response with the file content
    const fileResponse = new NextResponse(fileBuffer);
    
    // Set the appropriate headers
    fileResponse.headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
    fileResponse.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Return the file content
    return fileResponse;
  } catch (error) {
    console.error('Error proxying file download:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 