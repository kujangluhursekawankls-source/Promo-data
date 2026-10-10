import React, { useState, useRef } from 'react';
import { Promotion, PhotoItem } from '../types';
import { processImageFile, extractTitleFromContent, formatFileSize } from '../utils/fileUtils';
import {
  Camera,
  ImagePlus,
  X,
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { AIPromoModal } from './AIPromoModal';

interface PhotoPreviewItemProps {
  photo: PhotoItem;
  onRemove: (id: string) => void;
}

const PhotoPreviewItem: React.FC<PhotoPreviewItemProps> = ({ photo, onRemove }) => {
  const url = useBlobUrl(photo.blob);

  return (
    <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
      {url ? (
        <img src={url} alt={photo.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-100">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      )}
      <button
        type="button"
        onClick={() => onRemove(photo.id)}
        className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 active:scale-95 transition"
        title="Hapus Foto"
        aria-label="Hapus Foto"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[9px] px-1 py-0.5 truncate text-center">
        {formatFileSize(photo.size)}
      </div>
    </div>
  );
};

interface Props {
  initialPromotion?: Promotion | null;
  onSave: (promotion: Promotion) => Promise<boolean>;
  onCancel: () => void;
}

export const PromotionForm: React.FC<Props> = ({
  initialPromotion,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(initialPromotion);

  const [content, setContent] = useState<string>(initialPromotion?.content || '');
  const [previousContentBackup, setPreviousContentBackup] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPromotion?.photos || []);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State Modal AI
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessingPhotos(true);
    setErrorMsg(null);

    try {
      const newPhotos: PhotoItem[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        try {
          const processed = await processImageFile(file);
          newPhotos.push(processed);
        } catch (err) {
          console.error('Error memproses file:', file.name, err);
        }
      }

      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch (err) {
      setErrorMsg('Gagal memproses beberapa foto. Pastikan format foto didukung.');
    } finally {
      setIsProcessingPhotos(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Menerapkan hasil AI ke teks promosi dengan backup teks lama
  const handleApplyAIText = (generatedText: string) => {
    setPreviousContentBackup(content);
    setContent(generatedText);
  };

  // Mengembalikan teks sebelum AI diterapkan
  const handleUndoAIText = () => {
    if (previousContentBackup !== null) {
      setContent(previousContentBackup);
      setPreviousContentBackup(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && photos.length === 0) {
      setErrorMsg('Harap masukkan teks promosi atau pilih minimal 1 foto produk.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const title = extractTitleFromContent(content);
    const now = Date.now();

    const promotionData: Promotion = {
      id: initialPromotion?.id || 'promo_' + now + '_' + Math.random().toString(36).substring(2, 8),
      title,
      content: content.trim(),
      photos,
      createdAt: initialPromotion?.createdAt || now,
      updatedAt: now,
    };

    const success = await onSave(promotionData);
    setIsSubmitting(false);

    if (!success) {
      setErrorMsg('Gagal menyimpan ke penyimpanan lokal perangkat. Cek ruang penyimpanan Anda.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-slate-900 text-lg">
            {isEditing ? 'Edit Promosi' : 'Tambah Promosi Baru'}
          </h2>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isProcessingPhotos}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan</span>
            </>
          )}
        </button>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col gap-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bagian Foto Produk */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Foto Produk</span>
              {photos.length > 0 && (
                <span className="text-xs font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {photos.length} Foto
                </span>
              )}
            </label>
            <span className="text-[11px] text-slate-400">Bisa lebih dari 1 foto</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessingPhotos}
              className="py-3 px-3 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex flex-col items-center justify-center gap-1.5 active:scale-98 transition cursor-pointer"
            >
              <Camera className="w-6 h-6 text-emerald-600" />
              <span>Ambil dari Kamera</span>
            </button>

            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isProcessingPhotos}
              className="py-3 px-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 hover:bg-blue-100 text-blue-800 text-xs font-bold flex flex-col items-center justify-center gap-1.5 active:scale-98 transition cursor-pointer"
            >
              <ImagePlus className="w-6 h-6 text-blue-600" />
              <span>Pilih dari Galeri</span>
            </button>
          </div>

          {isProcessingPhotos && (
            <div className="py-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Memproses foto produk...</span>
            </div>
          )}

          {photos.length > 0 && (
            <div className="pt-2 flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
              {photos.map((photo) => (
                <PhotoPreviewItem
                  key={photo.id}
                  photo={photo}
                  onRemove={handleRemovePhoto}
                />
              ))}
            </div>
          )}
        </div>

        {/* Satu Kolom Teks Besar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex-1 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="promoText" className="text-sm font-bold text-slate-800">
              Kata-kata Promosi & Keterangan
            </label>
            <span className="text-[11px] text-slate-400">
              {content.length} karakter
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-normal">
            Tulis nama produk di baris pertama, lalu lanjutkan dengan harga, spesifikasi, dan kata promosi Anda.
          </p>

          {/* Tombol AI Promosi */}
          <button
            type="button"
            onClick={() => setIsAIModalOpen(true)}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-sm shadow-emerald-700/20 flex items-center justify-center gap-2 active:scale-99 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>✨ Buat Kata Promosi dengan AI</span>
          </button>

          {/* Banner Kembalikan Teks Semula Jika Baru Saja Pakai AI */}
          {previousContentBackup !== null && (
            <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <span className="font-medium">Teks AI telah diterapkan.</span>
              <button
                type="button"
                onClick={handleUndoAIText}
                className="font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 ml-2"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Kembalikan Teks Semula</span>
              </button>
            </div>
          )}

          <textarea
            id="promoText"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Contoh:\nSEPATU SNEAKERS PRIA AIR-PRO 2026\nHarga: Rp 189.000 (Diskon dari Rp 299.000)\n\nSpesifikasi:\n- Bahan: Canvas breathable + sol anti-slip\n- Ukuran: 39 - 44\n- Warna: Hitam, Abu, Putih\n\nPromo beli 2 gratis kaos kaki! Pesan via WhatsApp sekarang!`}
            rows={12}
            className="w-full flex-1 min-h-[220px] p-3 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/70 rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 leading-relaxed font-sans resize-y"
          />
        </div>

        {/* Tombol Simpan & Batal Bawah */}
        <div className="flex items-center gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 active:bg-slate-200 transition text-center"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isProcessingPhotos}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-md hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition text-center flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Promosi</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Generator AI Promosi */}
      <AIPromoModal
        isOpen={isAIModalOpen}
        initialText={content}
        photos={photos}
        onClose={() => setIsAIModalOpen(false)}
        onApplyResult={handleApplyAIText}
      />
    </div>
  );
};
