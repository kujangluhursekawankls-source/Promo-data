import { PhotoItem, Promotion } from '../types';

export interface ShareCapability {
  canShareText: boolean;
  canShareMultipleFiles: boolean;
  canShareSingleFile: boolean;
}

export function checkShareCapabilities(samplePhoto?: PhotoItem): ShareCapability {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return {
      canShareText: false,
      canShareMultipleFiles: false,
      canShareSingleFile: false,
    };
  }

  let canShareMultiple = false;
  let canShareSingle = false;

  if (typeof navigator.canShare === 'function') {
    try {
      const dummyFile1 = samplePhoto 
        ? new File([samplePhoto.blob], samplePhoto.name, { type: samplePhoto.mimeType })
        : new File([''], 'test1.jpg', { type: 'image/jpeg' });

      canShareSingle = navigator.canShare({ files: [dummyFile1] });

      const dummyFile2 = new File([''], 'test2.jpg', { type: 'image/jpeg' });
      canShareMultiple = navigator.canShare({ files: [dummyFile1, dummyFile2] });
    } catch (e) {
      console.warn('Error saat memeriksa navigator.canShare:', e);
      canShareSingle = false;
      canShareMultiple = false;
    }
  }

  return {
    canShareText: true,
    canShareMultipleFiles: canShareMultiple,
    canShareSingleFile: canShareSingle,
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Gagal menyalin teks ke clipboard:', err);
    return false;
  }
}

export async function sharePromotionWithAllPhotos(promo: Promotion): Promise<{ success: boolean; message: string; cancelled?: boolean }> {
  if (!navigator.share) {
    return { success: false, message: 'Fitur berbagi sistem tidak didukung pada peramban ini.' };
  }

  try {
    const files = promo.photos.map((p, idx) => {
      const ext = p.mimeType.split('/')[1] || 'jpg';
      const filename = p.name.includes('.') ? p.name : `foto_${idx + 1}.${ext}`;
      return new File([p.blob], filename, { type: p.mimeType });
    });

    if (navigator.canShare && files.length > 0 && !navigator.canShare({ files })) {
      return {
        success: false,
        message: 'Perangkat tidak mendukung berbagi beberapa foto sekaligus. Silakan pilih opsi bagikan foto satu per satu.',
      };
    }

    const shareData: ShareData = {
      title: promo.title,
      text: promo.content,
    };

    if (files.length > 0) {
      shareData.files = files;
    }

    await navigator.share(shareData);
    return { success: true, message: 'Promosi berhasil dibagikan!' };
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('abort') || err.message.includes('cancel'))) {
      return { success: false, message: 'Berbagi dibatalkan.', cancelled: true };
    }
    const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat membagikan promosi.';
    return { success: false, message: `Gagal membagikan: ${errMsg}` };
  }
}

export async function shareSinglePhoto(
  promo: Promotion,
  photo: PhotoItem
): Promise<{ success: boolean; message: string; cancelled?: boolean }> {
  if (!navigator.share) {
    return { success: false, message: 'Fitur berbagi sistem tidak didukung pada peramban ini.' };
  }

  try {
    const ext = photo.mimeType.split('/')[1] || 'jpg';
    const filename = photo.name.includes('.') ? photo.name : `foto_produk.${ext}`;
    const file = new File([photo.blob], filename, { type: photo.mimeType });

    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      return {
        success: false,
        message: 'Perangkat tidak mengizinkan pengiriman file foto ini melalui menu berbagi.',
      };
    }

    await navigator.share({
      title: promo.title,
      text: promo.content,
      files: [file],
    });

    return { success: true, message: 'Foto dan teks berhasil dibagikan!' };
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('abort') || err.message.includes('cancel'))) {
      return { success: false, message: 'Berbagi dibatalkan.', cancelled: true };
    }
    const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat membagikan foto.';
    return { success: false, message: `Gagal membagikan foto: ${errMsg}` };
  }
}

export async function shareTextOnly(promo: Promotion): Promise<{ success: boolean; message: string; cancelled?: boolean }> {
  if (!navigator.share) {
    return { success: false, message: 'Fitur berbagi sistem tidak didukung pada peramban ini.' };
  }

  try {
    await navigator.share({
      title: promo.title,
      text: promo.content,
    });
    return { success: true, message: 'Teks promosi berhasil dibagikan!' };
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('abort') || err.message.includes('cancel'))) {
      return { success: false, message: 'Berbagi dibatalkan.', cancelled: true };
    }
    const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat membagikan teks.';
    return { success: false, message: `Gagal membagikan: ${errMsg}` };
  }
}
