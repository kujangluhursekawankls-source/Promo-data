import React, { useState } from 'react';
import { Promotion, PhotoItem } from '../types';
import {
  sharePromotionWithAllPhotos,
  shareSinglePhoto,
  shareTextOnly,
} from '../utils/shareUtils';
import { triggerFileDownload } from '../utils/fileUtils';
import { useBlobUrl } from '../hooks/useBlobUrl';
import {
  X,
  Share2,
  FileText,
  Images,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface SinglePhotoRowProps {
  photo: PhotoItem;
  index: number;
  promo: Promotion;
  onShared: (msg: string) => void;
  onError: (msg: string) => void;
}

const SinglePhotoRow: React.FC<SinglePhotoRowProps> = ({
  photo,
  index,
  promo,
  onShared,
  onError,
}) => {
  const [sharing, setSharing] = useState(false);
  const url = useBlobUrl(photo.blob);

  const handleShareThisPhoto = async () => {
    setSharing(true);
    const result = await shareSinglePhoto(promo, photo);
    setSharing(false);

    if (result.success) {
      onShared(result.message);
    } else if (!result.cancelled) {
      onError(result.message);
    }
  };

  const handleDownloadThisPhoto = () => {
    const ext = photo.mimeType.split('/')[1] || 'jpg';
    triggerFileDownload(photo.blob, `promosi_${index + 1}.${ext}`, photo.mimeType);
  };

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-12 h-12 rounded-lg bg-slate-200 shrink-0 overflow-hidden">
          {url && <img src={url} alt={photo.name} className="w-full h-full object-cover" />}
        </div>
        <div className="truncate text-xs font-semibold text-slate-800">
          <span>Foto #{index + 1}</span>
          <p className="text-[10px] text-slate-400 font-normal truncate">{photo.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleDownloadThisPhoto}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition"
          title="Unduh foto ini"
          aria-label="Unduh foto"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleShareThisPhoto}
          disabled={sharing}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:bg-emerald-800 transition flex items-center gap-1 disabled:opacity-50"
        >
          {sharing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
          <span>Bagikan</span>
        </button>
      </div>
    </div>
  );
};

interface Props {
  isOpen: boolean;
  promotion: Promotion;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ShareModal: React.FC<Props> = ({
  isOpen,
  promotion,
  onClose,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'single'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const hasPhotos = promotion.photos && promotion.photos.length > 0;

  const handleShareAll = async () => {
    setIsProcessing(true);
    setStatusMessage(null);

    const result = await sharePromotionWithAllPhotos(promotion);
    setIsProcessing(false);

    if (result.success) {
      onToast(result.message, 'success');
      onClose();
    } else {
      if (result.cancelled) {
        setStatusMessage({ text: 'Berbagi dibatalkan oleh pengguna.', isError: false });
      } else {
        setStatusMessage({ text: result.message, isError: true });
        if (result.message.includes('beberapa foto')) {
          setActiveTab('single');
        }
      }
    }
  };

  const handleShareTextOnly = async () => {
    setIsProcessing(true);
    setStatusMessage(null);

    const result = await shareTextOnly(promotion);
    setIsProcessing(false);

    if (result.success) {
      onToast(result.message, 'success');
      onClose();
    } else if (!result.cancelled) {
      setStatusMessage({ text: result.message, isError: true });
    }
  };

  const handleDownloadAllPhotos = () => {
    if (!hasPhotos) return;
    promotion.photos.forEach((photo, idx) => {
      setTimeout(() => {
        const ext = photo.mimeType.split('/')[1] || 'jpg';
        triggerFileDownload(photo.blob, `promosi_${promotion.id}_${idx + 1}.${ext}`, photo.mimeType);
      }, idx * 250);
    });
    onToast(`Mengunduh ${promotion.photos.length} foto ke galeri...`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bagikan Promosi</h3>
              <p className="text-xs text-slate-500">Pilih metode berbagi ke WhatsApp / Medsos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              statusMessage.isError
                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {statusMessage.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {hasPhotos && promotion.photos.length > 1 && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Foto Sekaligus
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Foto Satu Per Satu
            </button>
          </div>
        )}

        {activeTab === 'all' ? (
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleShareAll}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Images className="w-5 h-5" />
              )}
              <span>
                {hasPhotos
                  ? `Bagikan Lengkap (${promotion.photos.length} Foto + Teks)`
                  : 'Bagikan Teks Promosi'}
              </span>
            </button>

            {hasPhotos && (
              <button
                type="button"
                onClick={handleShareTextOnly}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-2 transition"
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Bagikan Teks Promosi Saja</span>
              </button>
            )}

            {hasPhotos && (
              <button
                type="button"
                onClick={handleDownloadAllPhotos}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Unduh {promotion.photos.length} Foto ke Galeri HP</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-500 mb-1">
              Beberapa aplikasi seperti WhatsApp hanya mendukung satu foto bersamaan dengan caption teks:
            </p>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {promotion.photos.map((photo, idx) => (
                <SinglePhotoRow
                  key={photo.id}
                  photo={photo}
                  index={idx}
                  promo={promotion}
                  onShared={(msg) => onToast(msg, 'success')}
                  onError={(msg) => setStatusMessage({ text: msg, isError: true })}
                />
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
