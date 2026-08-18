import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BusinessProfile {
  uid: string;
  businessName: string;
  slug: string;
  messengerPageUsername: string;
  logoUrl?: string;
  status: 'pending' | 'active' | 'rejected';
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  icon?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description: string;
  imageUrl: string;
  available: boolean;
  isPopular?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}
