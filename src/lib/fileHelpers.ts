/**
 * Helper functions for file operations
 */

/**
 * Download a file using the server-side proxy to avoid blob URL issues
 * @param url The URL of the file to download
 * @param filename Optional filename for the downloaded file
 */
export function downloadFile(url: string, filename?: string): void {
  try {
    // Special handling for blob URLs
    if (url.startsWith('blob:')) {
      console.log('Using special blob URL handling');
      
      // Create a new XMLHttpRequest to get the blob
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';
      
      xhr.onload = function() {
        if (this.status === 200) {
          // Get the blob response
          const blob = this.response;
          
          // Create a new blob URL - this converts the external blob to a local one
          const newBlobUrl = URL.createObjectURL(blob);
          
          // Create download link
          const link = document.createElement('a');
          link.href = newBlobUrl;
          link.download = filename || 'download';
          link.style.display = 'none';
          
          // Click the link
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(newBlobUrl);
          }, 100);
        } else {
          console.error('Failed to fetch blob:', this.status);
          fallbackDownload(url, filename);
        }
      };
      
      xhr.onerror = function() {
        console.error('XHR error when fetching blob');
        fallbackDownload(url, filename);
      };
      
      xhr.send();
      return;
    }
    
    // Regular URLs use server proxy
    regularDownload(url, filename);
  } catch (error) {
    console.error('Error in primary download method:', error);
    fallbackDownload(url, filename);
  }
}

/**
 * Handle regular downloads through the proxy
 */
function regularDownload(url: string, filename?: string): void {
  // Create the proxy URL for non-blob URLs
  let proxyUrl = `/api/download?url=${encodeURIComponent(url)}`;
  
  // Add filename if provided
  if (filename) {
    proxyUrl += `&filename=${encodeURIComponent(filename)}`;
  }
  
  // Create a hidden anchor element
  const link = document.createElement('a');
  link.href = proxyUrl;
  link.download = filename || 'download';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  
  // Trigger the download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * Fallback download method using window.open
 */
function fallbackDownload(url: string, filename?: string): void {
  try {
    console.log('Using fallback download method');
    
    if (url.startsWith('blob:')) {
      // For blob URLs, use the window.navigator.msSaveOrOpenBlob method if available (IE/Edge)
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // Fetch the blob first
        fetch(url)
          .then(response => response.blob())
          .then(blob => {
            window.navigator.msSaveOrOpenBlob(blob, filename || 'download');
          })
          .catch(err => {
            console.error('msSaveOrOpenBlob failed:', err);
            window.open(url, '_blank');
          });
      } else {
        // Last resort for blob URLs - just open in a new tab
        window.open(url, '_blank');
      }
    } else {
      // For regular URLs, use the proxy with window.open
      const proxyUrl = `/api/download?url=${encodeURIComponent(url)}${filename ? `&filename=${encodeURIComponent(filename)}` : ''}`;
      window.open(proxyUrl, '_blank');
    }
  } catch (fallbackError) {
    console.error('All download methods failed:', fallbackError);
    alert('Download failed. Your browser may be blocking this operation. Please check your browser settings and try again.');
  }
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 