import { PhotoItem } from '../types';
import { blobToDataURL } from './fileUtils';
import { buildApiUrl } from './apiConfig';

export type AIPromoStyle = 'singkat' | 'santai' | 'profesional' | 'marketplace';

export interface GenerateAIPromoOptions {
  promptText: string;
  photos: PhotoItem[];
  style: AIPromoStyle;
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

  // Siapkan data foto (maksimal 3 foto untuk performa optimal)
  const selectedPhotos = photos.slice(0, 3);
  const serializedPhotos: Array<{ dataUrl: string; mimeType: string }> = [];

  for (const photo of selectedPhotos) {
    try {
      const dataUrl = await blobToDataURL(photo.blob);
      serializedPhotos.push({
        dataUrl,
        mimeType: photo.mimeType || 'image/jpeg',
      });
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
        throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      }
      throw err;
    }

    throw new Error('Terjadi kesalahan yang tidak diketahui saat memproses AI.');
  }
}
