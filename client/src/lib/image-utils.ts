/**
 * Download an image from a URL and save it to the user's device
 * @param url - The URL of the image to download
 * @param filename - The filename to save the image as (without extension)
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  
  // Check if URL is valid
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided');
  }
  
  const extension = getImageExtension(url) || 'png';
  const fullFilename = `${filename}.${extension}`;
  
  // Method 1: Try direct download first (works for blob URLs and same-origin URLs)
  if (url.startsWith('blob:') || isSameOrigin(url)) {
    directDownload(url, fullFilename);
    return;
  }

  // Special handling for Firebase URLs: go straight to fallback
  // as client-side fetch for blob creation is often blocked by CORS.
  if (url.includes('firebasestorage.googleapis.com')) {
    fallbackDownload(url, fullFilename);
    return;
  }
  
  // Method 2: Try fetching with CORS for other external URLs
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      fallbackDownload(url, fullFilename);
      return;
    }
    
    const blob = await response.blob();
    
    if (blob.size === 0) {
      fallbackDownload(url, fullFilename);
      return;
    }
    
    const blobUrl = URL.createObjectURL(blob);
    
    // Download using the blob URL
    directDownload(blobUrl, fullFilename);
    
    // Clean up the blob URL
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    
  } catch (fetchError) {
    
    // Method 3: Fallback - try to trigger download/open in new tab
    fallbackDownload(url, fullFilename);
  }
}

/**
 * Direct download using a blob URL or same-origin URL
 */
function directDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Fallback download method for CORS-restricted URLs
 */
function fallbackDownload(url: string, filename: string): void {
  
  // Try to trigger download with the original URL
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Check if URL is same origin
 */
function isSameOrigin(url: string): boolean {
  try {
    const urlObj = new URL(url, window.location.href);
    return urlObj.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Get the file extension from an image URL
 * @param url - The URL of the image
 * @returns The file extension or null if not found
 */
function getImageExtension(url: string): string | null {
  // Try to extract extension from URL
  const match = /\.([a-zA-Z0-9]+)(?:[?#]|$)/.exec(url);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }
  
  // Default to png if no extension found
  return 'png';
}

/**
 * Share an image
 * @param url - The URL of the image to share
 * @param title - The title for the share dialog
 */
export async function shareImage(url: string, title: string): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
      }
    }
  } else {
    // Fallback for browsers that don't support the Web Share API
    // Copy the URL to clipboard
    await navigator.clipboard.writeText(url);
    return Promise.resolve();
  }
} 