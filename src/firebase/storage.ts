import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

export const uploadMenuImage = async (uid: string, itemId: string, file: File) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file (JPG, PNG, etc.).');
  }

  // Validate file size (e.g., max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size too large. Maximum size is 5MB.');
  }

  // Get file extension
  const extension = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `menu-images/${uid}/${itemId}.${extension}`);
  
  const metadata = {
    contentType: file.type,
  };

  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
};

export const uploadLogo = async (uid: string, file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file (JPG, PNG, etc.).');
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Logo size too large. Maximum size is 2MB.');
  }

  const extension = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `logos/${uid}/logo.${extension}`);
  
  const metadata = {
    contentType: file.type,
  };

  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
};
