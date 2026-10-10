import React, { useState } from 'react';
import { PhotoItem } from '../types';
import { AIPromoStyle, generateAIPromotion } from '../utils/aiPromoService';
import {
  Sparkles,
  X,
  Loader2,
  Check,
  RefreshCw,
  AlertCircle,
  FileText,
  Images,
  ShoppingBag,
  MessageCircle,
  Briefcase,
  Zap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  initialText: string;
  photos: PhotoItem[];
  onClose: () => void;
  onApplyResult: (generatedText: string) => void;
}

export const AIPromoModal: React.FC<Props> = ({
  isOpen,
  initialText,
  photos,
  onClose,
  onApplyResult,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<AIPromoStyle>('santai');
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasPhotos = photos.length > 0;
  const hasText = initialText.trim().length > 0;

  const handleGenerate = async (overrideStyle?: AIPromoStyle) => {
    const styleToUse = overrideStyle || selectedStyle;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const generated = await generateAIPromotion({
        promptText: initialText,
        photos,
        style: styleToUse,
      });

      setResultText(generated);
    } catch (err) {
      console.error('Error generate AI:', err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses AI.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseResult = () => {
    if (resultText) {
      onApplyResult(resultText);
      onClose();
    }
  };

  const handleCancel = () => {
    // Menutup modal tanpa mengubah teks asli pengguna
    setResultText(null);
    setErrorMessage(null);
    onClose();
  };

  const styleOptions: Array<{
    id: AIPromoStyle;
    name: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'santai',
      name: 'Santai & Akrab',
      desc: 'Bahasa ramah, emotikon, dan hashtag populer untuk medsos / WA',
      icon: <MessageCircle className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'singkat',
      name: 'Singkat & Padat',
      desc: '3–5 kalimat to-the-point langsung ke inti produk & call-to-action',
      icon: <Zap className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'profesional',
      name: 'Katalog Profesional',
      desc: 'Struktur rapi, sopan, spesifikasi teratur, dan kredibel',
      icon: <Briefcase className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'marketplace',
      name: 'FB Marketplace & OLX',
      desc: 'Format listing jual-beli, judul kapital, kondisi, & ajakan chat/COD',
      icon: <ShoppingBag className="w-4 h-4 text-purple-600" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Buat Kata Promosi dengan AI
              </h3>
              <p className="text-xs text-slate-500">Didukung oleh Google Gemini</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ringkasan Bahan Produk */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Bahan Promosi:</span>
            {hasPhotos ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-medium">
                <Images className="w-3.5 h-3.5" />
                <span>{photos.length} Foto</span>
              </span>
            ) : (
              <span className="text-slate-400">Tanpa Foto</span>
            )}
            {hasText ? (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                <FileText className="w-3.5 h-3.5" />
                <span>Ada Teks</span>
              </span>
            ) : (
              <span className="text-slate-400">Teks Kosong</span>
            )}
          </div>
        </div>

        {/* Pesan Error Jika Ada */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">
              <p className="font-bold text-rose-800">Gagal Membuat Promosi</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* KONTEN 1: PILIHAN GAYA (Belum ada hasil atau ingin coba lagi) */}
        {!resultText && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2">
                Pilih Gaya Promosi:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {styleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedStyle(opt.id)}
                    disabled={isLoading}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                      selectedStyle === opt.id
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-1 rounded-lg bg-slate-100 mt-0.5">{opt.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{opt.name}</span>
                        {selectedStyle === opt.id && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tombol Eksekusi Buat AI */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isLoading || (!hasText && !hasPhotos)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-99 text-white font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Sedang Menganalisis & Meracik Promosi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Buat Kata Promosi Sekarang</span>
                </>
              )}
            </button>

            {!hasText && !hasPhotos && (
              <p className="text-[11px] text-slate-400 text-center">
                Pilih minimal 1 foto produk atau ketik keterangan produk terlebih dahulu.
              </p>
            )}
          </div>
        )}

        {/* KONTEN 2: HASIL AI DENGAN EDITOR YANG BISA DIUBAH */}
        {resultText && !isLoading && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hasil Kata Promosi AI:</span>
              </span>
              <span className="text-[11px] text-slate-400">Dapat diedit langsung</span>
            </div>

            {/* Kolom Editor Hasil AI */}
            <textarea
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              rows={9}
              className="w-full p-3 text-sm text-slate-800 bg-emerald-50/20 rounded-xl border border-emerald-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans resize-y"
              placeholder="Hasil promosi..."
            />

            <p className="text-[11px] text-slate-500 leading-tight">
              💡 <em>Teks awal Anda tersimpan aman dan tidak akan berubah sebelum Anda menekan tombol "Gunakan Hasil".</em>
            </p>

            {/* Baris Tombol Aksi: Gunakan Hasil, Coba Lagi, Batal */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleUseResult}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Gunakan Hasil Promosi Ini</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Lagi (Generate Ulang)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info jika belum selesai */}
        {!resultText && (
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-1 disabled:opacity-40"
            >
              Kembali ke Editor
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
