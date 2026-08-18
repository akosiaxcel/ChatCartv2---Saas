import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';
import { compressImage } from '../lib/imageCompressor';

/**
 * Uploads a menu dish image.
 * Compresses the image client-side first.
 * If Firebase Storage quota is exceeded or unavailable, automatically falls back
 * to returning the optimized compressed data URL so the user is NEVER blocked.
 */
export const uploadMenuImage = async (uid: string, itemId: string, file: File): Promise<string> => {
  // 1. Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file (JPG, PNG, WebP).');
  }

  // 2. Compress image to max 700x700 with high efficiency (~30KB-50KB)
  const { blob, dataUrl } = await compressImage(file, {
    maxWidth: 700,
    maxHeight: 700,
    quality: 0.75,
    outputType: 'image/jpeg'
  });

  try {
    const extension = 'jpg';
    const storageRef = ref(storage, `menu-images/${uid}/${itemId}.${extension}`);
    
    const metadata = {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000'
    };

    await uploadBytes(storageRef, blob, metadata);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (storageError: any) {
    console.warn(
      'Firebase Storage quota exceeded or unavailable. Seamlessly using optimized compressed image fallback:',
      storageError?.message || storageError
    );
    // Fallback: Return the high-efficiency compressed Data URL so the dish image works seamlessly
    return dataUrl;
  }
};

/**
 * Uploads a store logo.
 * Compresses the logo client-side to max 400x400.
 * Falls back to optimized Data URL if Firebase Storage bucket is full.
 */
export const uploadLogo = async (uid: string, file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file (JPG, PNG, WebP).');
  }

  const { blob, dataUrl } = await compressImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.8,
    outputType: 'image/jpeg'
  });

  try {
    const extension = 'jpg';
    const storageRef = ref(storage, `logos/${uid}/logo.${extension}`);
    
    const metadata = {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000'
    };

    await uploadBytes(storageRef, blob, metadata);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (storageError: any) {
    console.warn(
      'Firebase Storage quota exceeded or unavailable for logo. Seamlessly using compressed fallback:',
      storageError?.message || storageError
    );
    return dataUrl;
  }
};
