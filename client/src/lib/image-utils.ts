/**
 * Download an image from a URL and save it to the user's device
 * @param url - The URL of the image to download
 * @param filename - The filename to save the image as (without extension)
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const extension = getImageExtension(url) || 'png';
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Failed to download image');
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
        console.error('Error sharing image:', error);
      }
    }
  } else {
    // Fallback for browsers that don't support the Web Share API
    // Copy the URL to clipboard
    await navigator.clipboard.writeText(url);
    return Promise.resolve();
  }
}
