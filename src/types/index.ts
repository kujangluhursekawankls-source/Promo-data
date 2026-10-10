export interface PhotoItem {
  id: string;
  blob: Blob;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
}

export interface Promotion {
  id: string;
  title: string;
  content: string;
  photos: PhotoItem[];
  createdAt: number;
  updatedAt: number;
}

export interface SerializedPhotoItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
  dataUrl: string; // Base64 data URL for backup JSON
}

export interface SerializedPromotion {
  id: string;
  title: string;
  content: string;
  photos: SerializedPhotoItem[];
  createdAt: number;
  updatedAt: number;
}

export interface BackupData {
  app: 'FotoPromosi';
  version: number;
  exportDate: string;
  totalPromotions: number;
  promotions: SerializedPromotion[];
}

export type ViewMode = 'list' | 'add' | 'edit' | 'detail';
