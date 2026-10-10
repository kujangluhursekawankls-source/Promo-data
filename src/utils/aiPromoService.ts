import { PhotoItem } from '../types';
import { blobToDataURL } from './fileUtils';
import { buildApiUrl } from './apiConfig';

export type AIPromoStyle = 'singkat' | 'santai' | 'profesional' | 'marketplace';

export interface GenerateAIPromoOptions {
  promptText: string;
  photos: PhotoItem[];
  style: AIPromoStyle;
}

/**
 * Mengoptimalkan ukuran foto sebelum dikirim ke AI.
 * Foto kamera HP (5MB+) diperkecil ke resolusi max 800px (~150KB),
 * sehingga cepat diupload via jaringan seluler dan tidak melampaui batas payload Vercel (4.5MB).
 */
function optimizePhotoForAI(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
          return;
        }

        blobToDataURL(blob).then(resolve).catch(() => resolve(''));
      };
      img.onerror = () => blobToDataURL(blob).then(resolve).catch(() => resolve(''));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => blobToDataURL(blob).then(resolve).catch(() => resolve(''));
    reader.readAsDataURL(blob);
  });
}

export async function generateAIPromotion({
  promptText,
  photos,
  style,
}: GenerateAIPromoOptions): Promise<string> {
  // Cek koneksi internet browser
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error(
      'Koneksi internet terputus. Pastikan perangkat Anda terhubung ke internet untuk menggunakan fitur AI.'
    );
  }

  // Siapkan data foto yang dioptimasi (maksimal 3 foto untuk performa optimal)
  const selectedPhotos = photos.slice(0, 3);
  const serializedPhotos: Array<{ dataUrl: string; mimeType: string }> = [];

  for (const photo of selectedPhotos) {
    try {
      const optimizedDataUrl = await optimizePhotoForAI(photo.blob);
      if (optimizedDataUrl) {
        serializedPhotos.push({
          dataUrl: optimizedDataUrl,
          mimeType: 'image/jpeg',
        });
      }
    } catch (err) {
      console.warn('Gagal membaca blob foto untuk AI:', err);
    }
  }

  // Pasang batas waktu 40 detik
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000);

  try {
    const apiUrl = buildApiUrl('/api/ai/generate-promo');
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promptText,
        photos: serializedPhotos,
        style,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage =
        data?.error ||
        (res.status === 504
          ? 'Permintaan melebihi batas waktu (timeout).'
          : res.status === 413
          ? 'Ukuran foto produk terlalu besar. Kurangi jumlah foto.'
          : res.status === 429
          ? 'Batas kuota Gemini tercapai. Silakan coba sesaat lagi.'
          : 'Terjadi kesalahan saat memproses permintaan AI.');
      throw new Error(errorMessage);
    }

    if (!data?.generatedText) {
      throw new Error('AI tidak memberikan hasil teks promosi. Silakan coba lagi.');
    }

    return data.generatedText;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Permintaan ke AI melebihi batas waktu (timeout). Silakan coba lagi.');
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('Gagal terhubung ke server. Muat ulang (refresh) halaman atau periksa koneksi data HP Anda.');
      }
      throw err;
    }

    throw new Error('Terjadi kesalahan yang tidak diketahui saat memproses AI.');
  }
}
