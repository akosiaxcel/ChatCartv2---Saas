/**
 * Smart Client-Side Image Compressor
 * Resizes and compresses image files before upload or converts them to optimized Base64
 * to prevent Firebase Storage quota exhaustion and speed up load times.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<{ blob: Blob; dataUrl: string }> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.78,
    outputType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (JPG, PNG, WebP).'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not initialize canvas context.'));
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(outputType, quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              // Fallback to dataUrl conversion if toBlob is not supported
              resolve({
                blob: new Blob([dataUrl], { type: outputType }),
                dataUrl
              });
            }
          },
          outputType,
          quality
        );
      };

      img.onerror = (err) => reject(new Error('Failed to process image file.'));
    };

    reader.onerror = (err) => reject(new Error('Failed to read file from disk.'));
  });
};
