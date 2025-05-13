import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy file downloads through the server to avoid blob URL issues
 * This endpoint takes a URL and fetches the file server-side, then streams it to the client
 */
export async function GET(request: NextRequest) {
  try {
    // Get the file URL from the query parameter
    const url = request.nextUrl.searchParams.get('url');
    // Get explicit filename from query params or try to extract from URL later
    const explicitFilename = request.nextUrl.searchParams.get('filename');
    
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }
    
    // Check if URL is from allowed domains for security
    const allowedDomains = [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      'storage.cloud.google.com',
      '.supabase.co',
      'firebasestorage.app.goo.gl',
      '.cloudfront.net',
      'cdn.epu.edu.iq',
      'storage.epu.edu.iq'
    ];
    
    const isAllowedDomain = allowedDomains.some(domain => {
      if (domain.startsWith('.')) {
        // Handle wildcard subdomains
        const mainDomain = domain.substring(1);
        return url.includes(mainDomain);
      }
      return url.includes(domain);
    });
    
    if (!isAllowedDomain) {
      return NextResponse.json({ 
        error: 'Domain not allowed', 
        message: 'For security reasons, only specific domains are allowed for file downloads' 
      }, { status: 403 });
    }
    
    console.log(`Proxying download for: ${url}`);
    
    // Fetch the file with improved headers for better compatibility
    const fileResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 EPU Education Download Proxy'
      }
    });
    
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${fileResponse.statusText}` },
        { status: fileResponse.status }
      );
    }
    
    // Get content type and determine filename
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = fileResponse.headers.get('content-disposition');
    
    // Determine filename with priority:
    // 1. Explicit filename from query params
    // 2. Content-Disposition header
    // 3. Filename from URL
    // 4. Default "download" 
    let filename = 'download';
    
    if (explicitFilename) {
      filename = explicitFilename;
    } else if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    } else {
      // Try to extract filename from URL
      const urlParts = url.split('/');
      const potentialFilename = urlParts[urlParts.length - 1].split('?')[0];
      if (potentialFilename && potentialFilename.includes('.')) {
        filename = potentialFilename;
      }
    }
    
    // Get the file data
    const file = await fileResponse.arrayBuffer();
    
    // Create response with appropriate headers
    const response = new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': file.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
    
    return response;
  } catch (error) {
    console.error('Error proxying file download:', error);
    return NextResponse.json(
      { error: 'Failed to download file', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 