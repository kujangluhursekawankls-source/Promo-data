import React, { useState } from 'react';
import { Promotion } from '../types';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { formatIndonesianDate } from '../utils/fileUtils';
import { copyTextToClipboard } from '../utils/shareUtils';
import { Copy, Check, Share2, Image as ImageIcon, ChevronRight } from 'lucide-react';

interface Props {
  promotion: Promotion;
  onSelect: (promotion: Promotion) => void;
  onShare: (promotion: Promotion) => void;
  onCopySuccess: () => void;
}

export const PromotionCard: React.FC<Props> = ({
  promotion,
  onSelect,
  onShare,
  onCopySuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const firstPhoto = promotion.photos && promotion.photos.length > 0 ? promotion.photos[0] : null;
  const thumbnailUrl = useBlobUrl(firstPhoto?.blob);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyTextToClipboard(promotion.content);
    if (success) {
      setCopied(true);
      onCopySuccess();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(promotion);
  };

  const textLines = promotion.content.split('\n').filter((l) => l.trim().length > 0);
  const snippet = textLines.slice(1).join(' ').trim() || promotion.content;

  return (
    <div
      onClick={() => onSelect(promotion)}
      className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden active:scale-[0.99] transition cursor-pointer flex flex-col hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex gap-3.5 p-3.5">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200/70">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={promotion.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
              <ImageIcon className="w-8 h-8 opacity-40" />
              <span className="text-[10px] font-medium text-slate-400">Tanpa Foto</span>
            </div>
          )}

          {promotion.photos && promotion.photos.length > 0 && (
            <span className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-xs">
              <span>📷</span>
              <span>{promotion.photos.length}</span>
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                {promotion.title}
              </h3>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            </div>

            <p className="text-slate-600 text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">
              {snippet}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            <span>{formatIndonesianDate(promotion.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50/80 px-3.5 py-2 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            copied
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
          }`}
          title="Salin Teks ke Clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 transition flex items-center gap-1.5"
          title="Bagikan Promosi"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Bagikan</span>
        </button>
      </div>
    </div>
  );
};
