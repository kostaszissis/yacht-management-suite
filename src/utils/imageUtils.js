// ============================================
// IMAGE COMPRESSION UTILITIES
// ============================================

/**
 * Compress and resize an image from base64 string
 * @param base64String - The base64 image string (with or without data:image prefix)
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param maxHeight - Maximum height in pixels (default: 600)
 * @param quality - JPEG quality 0-1 (default: 0.7)
 * @returns Promise with compressed base64 string
 */
export function compressImage(
  base64String,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.7
) {
  return new Promise((resolve, reject) => {
    // Create image element
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed base64
      try {
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load the image
    img.src = base64String;
  });
}

/**
 * Get the size of a base64 string in KB
 * @param base64String - The base64 string
 * @returns Size in kilobytes
 */
export function getBase64Size(base64String) {
  const base64Length = base64String.length - (base64String.indexOf(',') + 1);
  const sizeInBytes = (base64Length * 3) / 4;
  return Math.round(sizeInBytes / 1024);
}

/**
 * Compress image with logging
 * @param base64String - The base64 image string
 * @param maxWidth - Maximum width (default: 800)
 * @param maxHeight - Maximum height (default: 600)
 * @param quality - Quality 0-1 (default: 0.7)
 * @returns Promise with compressed base64 string
 */
export async function compressImageWithLogging(
  base64String,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.7
) {
  const originalSize = getBase64Size(base64String);
  console.log(`📸 Original image size: ${originalSize}KB`);
  
  const compressed = await compressImage(base64String, maxWidth, maxHeight, quality);
  
  const compressedSize = getBase64Size(compressed);
  const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
  
  console.log(`✅ Compressed image size: ${compressedSize}KB (${reduction}% reduction)`);
  
  return compressed;
}