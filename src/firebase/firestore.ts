import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { db } from './config';
import { BusinessProfile, Category, MenuItem } from '../types';

// Business Profile
export const getBusinessProfile = async (uid: string): Promise<BusinessProfile | null> => {
  if (!uid) return null;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as BusinessProfile) : null;
  } catch (error) {
    console.warn(`[Firestore] getBusinessProfile notice for uid ${uid}:`, error);
    return null;
  }
};

export const getBusinessProfileBySlug = async (slug: string): Promise<BusinessProfile | null> => {
  if (!slug) return null;
  try {
    const colRef = collection(db, 'users');
    const q = query(colRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as BusinessProfile;
  } catch (error) {
    console.warn(`[Firestore] getBusinessProfileBySlug notice for slug ${slug}:`, error);
    return null;
  }
};

export const generateUniqueSlug = async (name: string, currentUid: string): Promise<string> => {
  const reserved = ['login', 'dashboard', 'editor', 'superadmin', 'admin', 'menu', 'api', 'settings', 'profile'];
  let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  if (!slug || reserved.includes(slug)) {
    slug = slug ? `${slug}-business` : 'business';
  }

  try {
    // Check if slug is already taken by another user
    const colRef = collection(db, 'users');
    const q = query(colRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    const otherUserUsingSlug = snapshot.docs.find(doc => doc.id !== currentUid);
    
    if (otherUserUsingSlug) {
      // Append a random string if taken
      slug = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
    }
  } catch (error) {
    console.warn('[Firestore] generateUniqueSlug query notice (generating safe slug):', error);
    slug = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
  }
  
  return slug;
};

export const updateBusinessProfile = async (uid: string, data: Partial<BusinessProfile>): Promise<Partial<BusinessProfile>> => {
  if (!uid) throw new Error("UID is required to update business profile");
  const docRef = doc(db, 'users', uid);
  
  // If business name is provided but slug is missing, generate it
  const finalData = { ...data };
  if (data.businessName && !data.slug) {
    finalData.slug = await generateUniqueSlug(data.businessName, uid);
  }

  await setDoc(docRef, { ...finalData, uid }, { merge: true });
  return finalData;
};

export const setBusinessStatus = async (uid: string, status: 'active' | 'rejected' | 'pending'): Promise<void> => {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, { status }, { merge: true });
};

export const deleteBusiness = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid));
};

// Categories
export const getCategories = async (uid: string): Promise<Category[]> => {
  if (!uid) return [];
  try {
    const colRef = collection(db, 'menus', uid, 'categories');
    const q = query(colRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (error) {
    console.warn(`[Firestore] getCategories notice for uid ${uid}:`, error);
    return [];
  }
};

export const saveCategory = async (uid: string, category: Partial<Category>): Promise<void> => {
  const id = category.id || doc(collection(db, 'menus', uid, 'categories')).id;
  const docRef = doc(db, 'menus', uid, 'categories', id);
  await setDoc(docRef, { ...category, id }, { merge: true });
};

export const deleteCategory = async (uid: string, categoryId: string): Promise<void> => {
  await deleteDoc(doc(db, 'menus', uid, 'categories', categoryId));
};

// Items
export const getMenuItems = async (uid: string): Promise<MenuItem[]> => {
  if (!uid) return [];
  try {
    const colRef = collection(db, 'menus', uid, 'items');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
  } catch (error) {
    console.warn(`[Firestore] getMenuItems notice for uid ${uid}:`, error);
    return [];
  }
};

export const saveMenuItem = async (uid: string, item: Partial<MenuItem>): Promise<void> => {
  const id = item.id || doc(collection(db, 'menus', uid, 'items')).id;
  const docRef = doc(db, 'menus', uid, 'items', id);
  await setDoc(docRef, { ...item, id }, { merge: true });
};

export const deleteMenuItem = async (uid: string, itemId: string): Promise<void> => {
  await deleteDoc(doc(db, 'menus', uid, 'items', itemId));
};
