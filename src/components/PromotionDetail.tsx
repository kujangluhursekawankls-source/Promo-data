import React, { useState } from 'react';
import { Promotion, PhotoItem } from '../types';
import { formatIndonesianDate } from '../utils/fileUtils';
import { copyTextToClipboard } from '../utils/shareUtils';
import { useBlobUrl } from '../hooks/useBlobUrl';
import {
  ArrowLeft,
  Edit3,
  Copy,
  Check,
  Share2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  promotion: Promotion;
  onBack: () => void;
  onEdit: (promotion: Promotion) => void;
  onDeleteRequest: (promotion: Promotion) => void;
  onShareRequest: (promotion: Promotion) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PhotoSlide: React.FC<{
  photo: PhotoItem;
  isActive: boolean;
  onTap: () => void;
}> = ({ photo, onTap }) => {
  const url = useBlobUrl(photo.blob);

  if (!url) return <div className="w-full h-72 bg-slate-100 animate-pulse" />;

  return (
    <div
      onClick={onTap}
      className="w-full h-72 sm:h-80 bg-slate-900 flex items-center justify-center cursor-zoom-in relative"
    >
      <img
        src={url}
        alt={photo.name}
        className="max-h-full max-w-full object-contain"
      />
      <div className="absolute top-3 right-3 bg-slate-900/60 text-white p-1.5 rounded-full backdrop-blur-xs">
        <Maximize2 className="w-4 h-4" />
      </div>
    </div>
  );
};

const LightboxModal: React.FC<{
  photo: PhotoItem;
  onClose: () => void;
}> = ({ photo, onClose }) => {
  const url = useBlobUrl(photo.blob);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-2"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-xs transition"
        aria-label="Tutup foto"
      >
        <X className="w-6 h-6" />
      </button>

      {url && (
        <img
          src={url}
          alt={photo.name}
          className="max-h-[90vh] max-w-[95vw] object-contain select-none"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <p className="absolute bottom-4 text-white/80 text-xs text-center font-medium">
        {photo.name}
      </p>
    </div>
  );
};

export const PromotionDetail: React.FC<Props> = ({
  promotion,
  onBack,
  onEdit,
  onDeleteRequest,
  onShareRequest,
  onToast,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  const hasPhotos = promotion.photos && promotion.photos.length > 0;
  const currentPhoto = hasPhotos ? promotion.photos[currentPhotoIndex] : null;

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(promotion.content);
    if (ok) {
      setCopied(true);
      onToast('Seluruh teks promosi berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2200);
    } else {
      onToast('Gagal menyalin teks ke clipboard.', 'error');
    }
  };

  const handlePrevPhoto = () => {
    if (!hasPhotos) return;
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : promotion.photos.length - 1));
  };

  const handleNextPhoto = () => {
    if (!hasPhotos) return;
    setCurrentPhotoIndex((prev) => (prev < promotion.photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
      {lightboxPhoto && (
        <LightboxModal photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
      )}

      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-slate-900 text-base sm:text-lg line-clamp-1">
            {promotion.title}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(promotion)}
            className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition"
            title="Edit Promosi"
            aria-label="Edit"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(promotion)}
            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
            title="Hapus Promosi"
            aria-label="Hapus"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto w-full flex flex-col gap-4 p-4">
        {hasPhotos ? (
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
            <div className="relative">
              {currentPhoto && (
                <PhotoSlide
                  photo={currentPhoto}
                  isActive={true}
                  onTap={() => setLightboxPhoto(currentPhoto)}
                />
              )}

              {promotion.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-xs transition"
                    aria-label="Foto sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-xs transition"
                    aria-label="Foto berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2.5 left-1/2 -translate-y-0 -translate-x-1/2 bg-slate-900/70 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    {currentPhotoIndex + 1} / {promotion.photos.length}
                  </div>
                </>
              )}
            </div>

            {promotion.photos.length > 1 && (
              <div className="p-2.5 flex gap-2 overflow-x-auto bg-slate-100/70 border-t border-slate-200">
                {promotion.photos.map((p, idx) => (
                  <ThumbnailItem
                    key={p.id}
                    photo={p}
                    isSelected={idx === currentPhotoIndex}
                    onClick={() => setCurrentPhotoIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <ImageIcon className="w-12 h-12 opacity-30" />
            <p className="text-sm">Promosi ini tidak memiliki foto</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Teks Promosi
            </span>
            <span className="text-xs text-slate-400">
              {formatIndonesianDate(promotion.updatedAt)}
            </span>
          </div>

          <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap select-text font-sans break-words py-1">
            {promotion.content}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-4 shadow-lg z-20">
        <div className="max-w-md mx-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-600/20 shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'Teks Tersalin!' : 'Salin Teks'}</span>
          </button>

          <button
            type="button"
            onClick={() => onShareRequest(promotion)}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ThumbnailItem: React.FC<{
  photo: PhotoItem;
  isSelected: boolean;
  onClick: () => void;
}> = ({ photo, isSelected, onClick }) => {
  const url = useBlobUrl(photo.blob);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition ${
        isSelected
          ? 'border-emerald-600 scale-105 shadow-xs'
          : 'border-transparent opacity-70 hover:opacity-100'
      }`}
    >
      {url && <img src={url} alt={photo.name} className="w-full h-full object-cover" />}
    </button>
  );
};
