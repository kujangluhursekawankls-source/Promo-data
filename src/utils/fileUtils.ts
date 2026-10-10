import { PhotoItem, Promotion, SerializedPhotoItem, SerializedPromotion } from '../types';

export async function processImageFile(file: File): Promise<PhotoItem> {
  const id = 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  
  if (!file.type.startsWith('image/')) {
    throw new Error(`File ${file.name} bukan format gambar yang valid.`);
  }

  try {
    const optimizedBlob = await compressImage(file, 1800, 0.88);
    return {
      id,
      blob: optimizedBlob,
      name: file.name || `foto_produk_${Date.now()}.jpg`,
      mimeType: optimizedBlob.type || 'image/jpeg',
      size: optimizedBlob.size,
      createdAt: Date.now(),
    };
  } catch (err) {
    console.warn('Gagal mengompresi gambar, menyimpan file asli:', err);
    return {
      id,
      blob: file,
      name: file.name || `foto_produk_${Date.now()}.jpg`,
      mimeType: file.type || 'image/jpeg',
      size: file.size,
      createdAt: Date.now(),
    };
  }
}

function compressImage(file: File, maxDimension: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat elemen gambar.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal mengonversi blob ke string data URL.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca blob.'));
    reader.readAsDataURL(blob);
  });
}

export function dataURLToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  if (parts.length < 2) {
    throw new Error('Format data URL tidak valid.');
  }
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

export async function serializePromotionsForBackup(promotions: Promotion[]): Promise<SerializedPromotion[]> {
  const serializedList: SerializedPromotion[] = [];

  for (const promo of promotions) {
    const serializedPhotos: SerializedPhotoItem[] = [];

    for (const photo of promo.photos) {
      const dataUrl = await blobToDataURL(photo.blob);
      serializedPhotos.push({
        id: photo.id,
        name: photo.name,
        mimeType: photo.mimeType,
        size: photo.size,
        createdAt: photo.createdAt,
        dataUrl,
      });
    }

    serializedList.push({
      id: promo.id,
      title: promo.title,
      content: promo.content,
      photos: serializedPhotos,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
    });
  }

  return serializedList;
}

export function deserializePromotionsFromBackup(serializedList: SerializedPromotion[]): Promotion[] {
  return serializedList.map((item) => {
    const photos: PhotoItem[] = (item.photos || []).map((p) => {
      let blob: Blob;
      try {
        blob = dataURLToBlob(p.dataUrl);
      } catch (err) {
        console.warn('Gagal memulihkan blob untuk foto:', p.name, err);
        blob = new Blob([], { type: p.mimeType || 'image/jpeg' });
      }

      return {
        id: p.id || 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        blob,
        name: p.name || 'foto_produk.jpg',
        mimeType: p.mimeType || 'image/jpeg',
        size: p.size || blob.size,
        createdAt: p.createdAt || Date.now(),
      };
    });

    return {
      id: item.id || 'promo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: item.title || extractTitleFromContent(item.content),
      content: item.content || '',
      photos,
      createdAt: item.createdAt || Date.now(),
      updatedAt: item.updatedAt || Date.now(),
    };
  });
}

export function extractTitleFromContent(content: string): string {
  if (!content || !content.trim()) {
    return 'Promosi Tanpa Judul';
  }
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      return trimmed.length > 60 ? trimmed.substring(0, 57) + '...' : trimmed;
    }
  }
  return 'Promosi Tanpa Judul';
}

export function formatIndonesianDate(timestamp: number): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Hari ini, ${timeStr}`;
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Kemarin, ${timeStr}`;
  }

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }) + `, ${timeStr}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function triggerFileDownload(content: Blob | string, filename: string, mimeType = 'application/json'): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
