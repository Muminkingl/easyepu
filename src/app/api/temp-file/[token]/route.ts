import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import crypto from 'crypto';

// In-memory store for temporary file mappings (would use Redis in real production)
interface TempFileEntry {
  filePath: string;
  expires: number;
  filename: string;
}

// Global temp file storage - Note: this will be cleared when the serverless function restarts
const tempFiles = new Map<string, TempFileEntry>();

// Function to clean up expired files
const cleanupExpiredFiles = async () => {
  const now = Date.now();
  for (const [token, entry] of tempFiles.entries()) {
    if (entry.expires < now) {
      try {
        await unlink(entry.filePath);
        tempFiles.delete(token);
      } catch (error) {
        console.error(`Failed to delete expired file: ${entry.filePath}`, error);
      }
    }
  }
};

// Register a temporary file
export async function registerTempFile(filePath: string, fileName: string): Promise<string> {
  // Clean up expired files
  await cleanupExpiredFiles();
  
  // Generate a token
  const token = crypto.randomBytes(16).toString('hex');
  
  // Store the mapping
  tempFiles.set(token, {
    filePath,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    filename: fileName
  });
  
  return token;
}

// Get API route
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }
    
    // Look up the file entry
    const fileEntry = tempFiles.get(token);
    
    if (!fileEntry) {
      return NextResponse.json({ 
        error: 'File not found or expired',
        message: 'The requested file is no longer available for download'
      }, { status: 404 });
    }
    
    // Check if file has expired
    if (fileEntry.expires < Date.now()) {
      tempFiles.delete(token);
      try {
        await unlink(fileEntry.filePath);
      } catch (error) {
        console.error(`Failed to delete expired file: ${fileEntry.filePath}`, error);
      }
      
      return NextResponse.json({ 
        error: 'File expired',
        message: 'The download link has expired'
      }, { status: 410 });
    }
    
    // Get filename from query params or use the stored one
    const fileName = request.nextUrl.searchParams.get('filename') || fileEntry.filename;
    
    try {
      // Read the file
      const fileData = await readFile(fileEntry.filePath);
      
      // Determine content type based on file extension
      let contentType = 'application/octet-stream';
      if (fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext) {
          switch (ext) {
            case 'pdf': contentType = 'application/pdf'; break;
            case 'jpg': case 'jpeg': contentType = 'image/jpeg'; break;
            case 'png': contentType = 'image/png'; break;
            case 'gif': contentType = 'image/gif'; break;
            case 'svg': contentType = 'image/svg+xml'; break;
            case 'mp4': contentType = 'video/mp4'; break;
            case 'mp3': contentType = 'audio/mpeg'; break;
            case 'doc': contentType = 'application/msword'; break;
            case 'docx': contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
            case 'xls': contentType = 'application/vnd.ms-excel'; break;
            case 'xlsx': contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break;
            case 'ppt': contentType = 'application/vnd.ms-powerpoint'; break;
            case 'pptx': contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; break;
            case 'txt': contentType = 'text/plain'; break;
            case 'html': contentType = 'text/html'; break;
            case 'css': contentType = 'text/css'; break;
            case 'js': contentType = 'application/javascript'; break;
            case 'json': contentType = 'application/json'; break;
            case 'zip': contentType = 'application/zip'; break;
            case 'rar': contentType = 'application/x-rar-compressed'; break;
            case '7z': contentType = 'application/x-7z-compressed'; break;
          }
        }
      }
      
      // Delete the file after it's served to save space
      // Set to delete after a small delay to ensure it's fully downloaded
      setTimeout(async () => {
        try {
          await unlink(fileEntry.filePath);
          tempFiles.delete(token);
        } catch (error) {
          console.error(`Failed to delete temp file: ${fileEntry.filePath}`, error);
        }
      }, 1000);
      
      // Return the file
      return new NextResponse(fileData, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Content-Length': fileData.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (error) {
      console.error(`Error reading file: ${fileEntry.filePath}`, error);
      return NextResponse.json({ 
        error: 'Failed to read file',
        message: 'The file could not be read from the server'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error serving temporary file:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 