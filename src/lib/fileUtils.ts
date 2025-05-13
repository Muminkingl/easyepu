/**
 * Utility functions for handling files, especially blob URLs
 */

/**
 * Attempts to download a file from a blob URL by extracting its content
 * @param blobUrl The blob URL to download
 * @param filename The filename to use for the downloaded file
 * @returns A promise that resolves when the download is complete or rejects if it fails
 */
export async function downloadBlobUrl(blobUrl: string, filename: string): Promise<boolean> {
  try {
    // Fetch the blob data using XHR (works in more browsers than fetch for blob: URLs)
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', blobUrl, true);
      xhr.responseType = 'blob';
      
      xhr.onload = function() {
        if (this.status !== 200) {
          reject(new Error(`Failed to fetch blob: ${this.status}`));
          return;
        }
        
        // Get the blob from the response
        const blob = this.response;
        
        // Create a downloadable URL from the blob
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link element to trigger the download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        
        // Trigger the download
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        resolve(true);
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error occurred while fetching blob'));
      };
      
      xhr.send();
    });
  } catch (error) {
    console.error('Error downloading blob URL:', error);
    throw error;
  }
}

/**
 * Opens a blob URL in a hidden iframe and attempts to download it
 * This approach can sometimes work when direct methods fail
 * @param blobUrl The blob URL to download
 * @param filename The filename to use for the downloaded file
 */
export function downloadBlobViaIframe(blobUrl: string, filename: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      // Create an iframe to load the blob
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Set a timeout to clean up the iframe
      const timeoutId = setTimeout(() => {
        document.body.removeChild(iframe);
        reject(new Error('Iframe download timed out'));
      }, 10000); // 10 second timeout
      
      // Handle iframe load event
      iframe.onload = () => {
        try {
          if (!iframe.contentWindow || !iframe.contentDocument) {
            throw new Error('Cannot access iframe content window');
          }
          
          // Create a download link in the iframe
          const link = iframe.contentDocument.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          link.style.display = 'none';
          
          // Add the link to the iframe's document
          iframe.contentDocument.body.appendChild(link);
          
          // Trigger the download
          link.click();
          
          // Clean up
          clearTimeout(timeoutId);
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve(true);
          }, 1000);
        } catch (error) {
          clearTimeout(timeoutId);
          document.body.removeChild(iframe);
          reject(error);
        }
      };
      
      // Set the iframe source to the blob URL
      iframe.src = blobUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Try all available methods to download a blob URL
 * @param blobUrl The blob URL to download
 * @param filename The filename to use for the downloaded file
 */
export async function tryAllBlobDownloadMethods(blobUrl: string, filename: string): Promise<boolean> {
  try {
    // Method 1: Direct XHR download
    try {
      await downloadBlobUrl(blobUrl, filename);
      console.log('Blob downloaded via XHR method');
      return true;
    } catch (error) {
      console.warn('XHR download failed, trying iframe method:', error);
    }
    
    // Method 2: Iframe download
    try {
      await downloadBlobViaIframe(blobUrl, filename);
      console.log('Blob downloaded via iframe method');
      return true;
    } catch (error) {
      console.warn('Iframe download failed, trying direct method:', error);
    }
    
    // Method 3: Direct window.open as last resort
    window.open(blobUrl, '_blank');
    console.log('Opened blob URL in new tab as fallback');
    return true;
  } catch (error) {
    console.error('All blob download methods failed:', error);
    return false;
  }
} 