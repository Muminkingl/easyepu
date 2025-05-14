import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

// For serverless environment, we'll use cookies instead of in-memory cache
const COOKIE_PREFIX = 'blob_token_';
const MAX_COOKIE_SIZE = 4000; // Cookies have size limits

/**
 * Register a blob URL to be downloaded
 */
export async function POST(request: NextRequest) {
  try {
    // Get the blob URL from the request body
    const data = await request.json();
    const { blobUrl, filename } = data;
    
    if (!blobUrl) {
      return NextResponse.json({ error: 'Invalid or missing blob URL' }, { status: 400 });
    }
    
    // Generate a unique token to identify this blob
    const token = crypto.randomBytes(16).toString('hex');
    
    // Create a cookie with the blob information
    const cookieStore = cookies();
    const cookieValue = JSON.stringify({
      url: blobUrl,
      filename: filename || 'download',
      expiry: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
    });
    
    // Check if cookie value is too large
    if (cookieValue.length > MAX_COOKIE_SIZE) {
      return NextResponse.json({
        error: 'URL too large for cookie storage',
        message: 'The blob URL is too large to store in a cookie. Try a different approach for large files.'
      }, { status: 413 });
    }
    
    // Store data in a cookie
    cookieStore.set({
      name: `${COOKIE_PREFIX}${token}`,
      value: cookieValue,
      maxAge: 300, // 5 minutes
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
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
    
    // Retrieve the blob URL from cookies
    const cookieStore = cookies();
    const cookie = cookieStore.get(`${COOKIE_PREFIX}${token}`);
    
    if (!cookie) {
      return NextResponse.json({ error: 'Token not found or expired' }, { status: 404 });
    }
    
    // Parse the cookie value
    const { url, filename, expiry } = JSON.parse(cookie.value);
    
    // Check if the token has expired
    if (expiry < Date.now()) {
      cookieStore.delete(`${COOKIE_PREFIX}${token}`);
      return NextResponse.json({ error: 'Token expired' }, { status: 410 });
    }
    
    // For security, delete the cookie after it's used
    cookieStore.delete(`${COOKIE_PREFIX}${token}`);
    
    // Instead of redirecting to the blob URL (which won't work across different instances),
    // we need a different approach
    
    // Return a special HTML page that will handle the blob URL client-side
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Downloading ${filename}</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #1e1e2e;
              color: #e0e0e0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .container {
              background: rgba(30, 41, 59, 0.8);
              border-radius: 12px;
              padding: 2rem;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              max-width: 500px;
              width: 90%;
              border: 1px solid rgba(79, 70, 229, 0.3);
            }
            h1 { color: #f8fafc; margin-top: 0; }
            p { margin: 1rem 0; line-height: 1.5; }
            .message { 
              margin-top: 1rem;
              font-size: 0.9rem;
              color: #94a3b8;
            }
            .spinner {
              border: 4px solid rgba(0, 0, 0, 0.1);
              border-radius: 50%;
              border-top: 4px solid #6366f1;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 1rem auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            button {
              background: #6366f1;
              color: white;
              border: none;
              padding: 0.7rem 1.5rem;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
              margin-top: 1rem;
              transition: background 0.2s;
            }
            button:hover {
              background: #4f46e5;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Downloading File</h1>
            <div class="spinner"></div>
            <p>Your file "<strong>${filename}</strong>" should download automatically.</p>
            <p>If the download doesn't start automatically, please click the button below:</p>
            <button id="downloadBtn">Download Now</button>
            <div class="message">Redirecting back to the previous page in a few seconds...</div>
          </div>
          
          <script>
            // The URL from the cookie
            const blobUrl = "${url}";
            const fileName = "${filename}";
            
            // Function to trigger the download
            function downloadFile() {
              try {
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = blobUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                setTimeout(() => {
                  document.body.removeChild(a);
                }, 100);
                
                // Go back to the previous page after a short delay
                setTimeout(() => {
                  window.history.back();
                }, 3000);
              } catch (error) {
                console.error('Error downloading file:', error);
                alert('Download failed. Please try again or use a different browser.');
              }
            }
            
            // Trigger download immediately
            downloadFile();
            
            // Add click handler for the button
            document.getElementById('downloadBtn').addEventListener('click', downloadFile);
          </script>
        </body>
      </html>
    `;
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error retrieving blob URL:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve blob URL', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 